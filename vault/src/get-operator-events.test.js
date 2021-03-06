/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var assert = require('assert')
var sinon = require('sinon')
var Unibabel = require('unibabel').Unibabel

var getOperatorEventsWith = require('./get-operator-events').getOperatorEventsWith

describe('src/get-operator-events', function () {
  describe('getOperatorEvents', function () {
    context('with no pending events', function () {
      var accountKey
      var keyEncryptionJWK
      var encryptedPrivateKey
      var accountPrivateJWK
      before(function () {
        var keyEncryptionKey
        return window.crypto.subtle.generateKey(
          {
            name: 'RSA-OAEP',
            modulusLength: 2048,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: { name: 'SHA-256' }
          },
          true,
          ['encrypt', 'decrypt']
        )
          .then(function (_accountKey) {
            accountKey = _accountKey
          })
          .then(function () {
            return window.crypto.subtle.generateKey(
              {
                name: 'AES-GCM',
                length: 256
              },
              true,
              ['encrypt', 'decrypt']
            )
          })
          .then(function (_keyEncryptionKey) {
            keyEncryptionKey = _keyEncryptionKey
            return window.crypto.subtle.exportKey('jwk', keyEncryptionKey)
          })
          .then(function (_keyEncryptionJWK) {
            keyEncryptionJWK = _keyEncryptionJWK
            return window.crypto.subtle.exportKey('jwk', accountKey.privateKey)
          })
          .then(function (_accountPrivateJWK) {
            accountPrivateJWK = _accountPrivateJWK
            var nonce = window.crypto.getRandomValues(new Uint8Array(12))
            return window.crypto.subtle.encrypt(
              {
                name: 'AES-GCM',
                iv: nonce,
                length: 128
              },
              keyEncryptionKey,
              Unibabel.utf8ToBuffer(JSON.stringify(accountPrivateJWK))
            )
              .then(function (encrypted) {
                encryptedPrivateKey = '{1,} ' + Unibabel.arrToBase64(new Uint8Array(encrypted)) + ' ' + Unibabel.arrToBase64(new Uint8Array(nonce))
              })
          })
      })

      it('syncs the database and returns stats plus account info', function () {
        var mockQueries = {
          getDefaultStats: sinon.stub().resolves({ mock: 'result' }),
          getAllEventIds: sinon.stub().resolves(['a', 'b', 'c', 'd']),
          getLatestEvent: sinon.stub().resolves({ eventId: 'd' }),
          deleteEvents: sinon.stub().resolves(true),
          putEvents: sinon.stub().resolves(true),
          putEncryptedSecrets: sinon.stub().resolves()
        }
        var mockApi = {
          getDeletedEvents: sinon.stub().resolves({ eventIds: ['a'] }),
          getAccount: sinon.stub().resolves({ accountId: 'account-a', encryptedPrivateKey: encryptedPrivateKey })
        }
        var getOperatorEvents = getOperatorEventsWith(mockQueries, mockApi)
        return getOperatorEvents(
          { accountId: 'account-a' },
          {
            accounts: [
              { accountId: 'account-a', keyEncryptionKey: keyEncryptionJWK }
            ]
          }
        )
          .then(function (result) {
            assert.deepStrictEqual(result, {
              mock: 'result',
              account: {
                accountId: 'account-a',
                privateJwk: accountPrivateJWK,
                encryptedPrivateKey: encryptedPrivateKey
              }
            })
          })
      })
    })

    context('with pending events', function () {
      var userSecret
      var encryptedUserSecret
      var encryptedEventPayload
      var accountKey
      var userJWK
      var nonce
      var keyEncryptionKey
      var keyEncryptionJWK
      var encryptedPrivateKey

      before(function () {
        return window.crypto.subtle.generateKey(
          {
            name: 'AES-GCM',
            length: 256
          },
          true,
          ['encrypt', 'decrypt']
        )
          .then(function (_userSecret) {
            userSecret = _userSecret
            return window.crypto.subtle.exportKey('jwk', userSecret)
          })
          .then(function (_userJWK) {
            userJWK = _userJWK
            return window.crypto.subtle.generateKey(
              {
                name: 'RSA-OAEP',
                modulusLength: 2048,
                publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
                hash: { name: 'SHA-256' }
              },
              true,
              ['encrypt', 'decrypt']
            )
          })
          .then(function (_accountKey) {
            accountKey = _accountKey
            return window.crypto.subtle.encrypt(
              {
                name: 'RSA-OAEP'
              },
              accountKey.publicKey,
              Unibabel.utf8ToBuffer(JSON.stringify(userJWK))
            )
          })
          .then(function (encrypted) {
            encryptedUserSecret = '{1,} ' + Unibabel.arrToBase64(new Uint8Array(encrypted))
          })
          .then(function () {
            nonce = window.crypto.getRandomValues(new Uint8Array(12))
            return window.crypto.subtle.encrypt(
              {
                name: 'AES-GCM',
                iv: nonce,
                length: 128
              },
              userSecret,
              Unibabel.utf8ToBuffer(JSON.stringify({ timestamp: 'timestamp-fixture' }))
            )
          })
          .then(function (encrypted) {
            encryptedEventPayload = '{1,} ' + Unibabel.arrToBase64(new Uint8Array(encrypted)) + ' ' + Unibabel.arrToBase64(new Uint8Array(nonce))
          })
          .then(function () {
            return window.crypto.subtle.generateKey(
              {
                name: 'AES-GCM',
                length: 256
              },
              true,
              ['encrypt', 'decrypt']
            )
          })
          .then(function (_keyEncryptionKey) {
            keyEncryptionKey = _keyEncryptionKey
            return window.crypto.subtle.exportKey('jwk', keyEncryptionKey)
          })
          .then(function (_keyEncryptionJWK) {
            keyEncryptionJWK = _keyEncryptionJWK
            return window.crypto.subtle.exportKey('jwk', accountKey.privateKey)
          })
          .then(function (accountPrivateJWK) {
            var nonce = window.crypto.getRandomValues(new Uint8Array(12))
            return window.crypto.subtle.encrypt(
              {
                name: 'AES-GCM',
                iv: nonce,
                length: 128
              },
              keyEncryptionKey,
              Unibabel.utf8ToBuffer(JSON.stringify(accountPrivateJWK))
            )
              .then(function (encrypted) {
                encryptedPrivateKey = '{1,} ' + Unibabel.arrToBase64(new Uint8Array(encrypted)) + ' ' + Unibabel.arrToBase64(new Uint8Array(nonce))
              })
          })
      })

      it('syncs the database and returns stats plus account info', function () {
        var mockQueries = {
          getDefaultStats: sinon.stub().resolves({ mock: 'result' }),
          getAllEventIds: sinon.stub().resolves(['a', 'b', 'c', 'd']),
          getLatestEvent: sinon.stub().resolves({ eventId: 'd' }),
          deleteEvents: sinon.stub().resolves(true),
          putEvents: sinon.stub().resolves(true),
          putEncryptedSecrets: sinon.stub().resolves()
        }
        var mockApi = {
          getDeletedEvents: sinon.stub().resolves({ eventIds: ['a'] }),
          getAccount: sinon.stub().resolves({
            events: {
              'account-a': [{
                eventId: 'z',
                secretId: 'user-a',
                accountId: 'account-a',
                payload: encryptedEventPayload
              }]
            },
            secrets: {
              'user-a': encryptedUserSecret
            },
            name: 'test',
            accountId: 'account-a',
            encryptedPrivateKey: encryptedPrivateKey
          })
        }
        var getOperatorEvents = getOperatorEventsWith(mockQueries, mockApi)
        return getOperatorEvents(
          { accountId: 'account-a' },
          {
            accounts: [
              { accountId: 'account-a', keyEncryptionKey: keyEncryptionJWK }
            ]
          }
        )
          .then(function (result) {
            assert(mockQueries.getAllEventIds.calledOnce)
            assert(mockQueries.getAllEventIds.calledWith('account-a'))

            assert(mockQueries.getLatestEvent.calledOnce)
            assert(mockQueries.getLatestEvent.calledWith('account-a'))

            assert(mockApi.getDeletedEvents.calledOnce)
            assert(mockApi.getDeletedEvents.calledWith(['a', 'b', 'c', 'd']))

            assert(mockApi.getAccount.calledOnce)
            assert(mockApi.getAccount.calledWith('account-a'))

            assert(mockQueries.deleteEvents.calledOnce)
            assert(mockQueries.deleteEvents.calledWith('account-a', 'a'))

            assert(mockQueries.putEvents.calledOnce)
            assert(mockQueries.putEvents.calledWith('account-a', {
              eventId: 'z',
              secretId: 'user-a',
              accountId: 'account-a',
              timestamp: 'timestamp-fixture',
              payload: encryptedEventPayload
            }))
          })
      })
    })
  })
})
