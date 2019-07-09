package relational

import (
	"fmt"

	"github.com/jinzhu/gorm"
	"github.com/offen/offen/server/persistence"
)

func (r *relationalDatabase) Insert(userID, accountID, payload string) error {
	eventID, err := newEventID()
	if err != nil {
		return fmt.Errorf("relational: error creating event identifier: %v", err)
	}

	var account Account
	err = r.db.Where(`account_id = ?`, accountID).First(&account).Error
	if err != nil {
		if gorm.IsRecordNotFoundError(err) {
			return persistence.ErrUnknownAccount(
				fmt.Sprintf("unknown account with id %s", accountID),
			)
		}
		return fmt.Errorf("relational: error looking up account with id %s: %v", accountID, err)
	}

	hashedUserID := account.HashUserID(userID)

	var user User
	if err := r.db.First(&user).Where("hashed_user_id = ?", hashedUserID).Error; gorm.IsRecordNotFoundError(err) {
		return persistence.ErrUnknownUser(
			fmt.Sprintf("unknown user with id %s", userID),
		)
	}

	r.db.Create(&Event{
		AccountID:    accountID,
		HashedUserID: hashedUserID,
		Payload:      payload,
		EventID:      eventID,
	})
	return nil
}

func (r *relationalDatabase) Query(query persistence.Query) (map[string][]persistence.EventResult, error) {
	userID := query.UserID()
	var result []Event
	out := map[string][]persistence.EventResult{}

	if userID == "" {
		if err := r.db.Preload("User").Find(&result, "account_id in (?)", query.AccountIDs()).Error; err != nil {
			return nil, fmt.Errorf("relational: error looking up account data for %v: %v", query.AccountIDs(), err)
		}
	} else {
		var accounts []Account
		if len(query.AccountIDs()) == 0 {
			if err := r.db.Find(&accounts).Error; err != nil {
				return nil, fmt.Errorf("relational: error looking up all accounts: %v", err)
			}
		} else {
			if err := r.db.Find(&accounts, "account_id in (?)", query.AccountIDs()).Error; err != nil {
				return nil, fmt.Errorf("relational: error looking up account data: %v", err)
			}
		}

		hashedUserIDs := hashUserIDForAccounts(userID, accounts)

		var eventConditions []interface{}
		if query.Since() != "" {
			eventConditions = []interface{}{
				"event_id > ? AND hashed_user_id in (?)",
				query.Since(),
				hashedUserIDs,
			}
		} else {
			eventConditions = []interface{}{"hashed_user_id in (?)", hashedUserIDs}
		}

		if err := r.db.Find(&result, eventConditions...).Error; err != nil {
			return nil, fmt.Errorf("relational: error looking up events: %v", err)
		}
	}

	for _, match := range result {
		out[match.AccountID] = append(out[match.AccountID], persistence.EventResult{
			AccountID: match.AccountID,
			UserID:    match.HashedUserID,
			Payload:   match.Payload,
			EventID:   match.EventID,
		})
	}
	return out, nil
}

func hashUserIDForAccounts(userID string, accounts []Account) []string {
	hashes := make(chan string)
	// in case a user queries for a longer list of account ids (or even all of them)
	// hashing the user ID against all salts can get relatively expensive, so
	// computation is being done concurrently
	for _, account := range accounts {
		go func(account Account) {
			hash := account.HashUserID(userID)
			hashes <- hash
		}(account)
	}

	var hashedUserIDs []string
	for result := range hashes {
		hashedUserIDs = append(hashedUserIDs, result)
		if len(hashedUserIDs) == len(accounts) {
			close(hashes)
			break
		}
	}
	return hashedUserIDs
}

func (r *relationalDatabase) GetDeletedEvents(ids []string, userID string) ([]string, error) {
	// First, perform a check which one of the events have been deleted
	var existing []Event
	if err := r.db.Where("event_id IN (?)", ids).Find(&existing).Error; err != nil {
		return nil, fmt.Errorf("relational: error looking up events: %v", err)
	}

	deletedIds := []string{}
outer:
	for _, id := range ids {
		for _, ev := range existing {
			if id == ev.EventID {
				continue outer
			}
		}
		deletedIds = append(deletedIds, id)
	}

	// The user might have changed their identifier and might know about events
	// associated to previous values, so the next check looks up events that
	// are still present but considered "foreign"
	if userID != "" {
		var accounts []Account
		if err := r.db.Find(&accounts).Error; err != nil {
			return nil, fmt.Errorf("relational: error looking up all accounts: %v", err)
		}

		hashedUserIDs := hashUserIDForAccounts(userID, accounts)
		var foreign []Event
		if err := r.db.Where("event_id IN (?) AND hashed_user_id NOT IN (?)", ids, hashedUserIDs).Find(&foreign).Error; err != nil {
			return nil, fmt.Errorf("relational: error looking up foreign events: %v", err)
		}

		for _, evt := range foreign {
			deletedIds = append(deletedIds, evt.EventID)
		}
	}

	return deletedIds, nil
}
