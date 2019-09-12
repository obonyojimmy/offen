package http

import (
	"encoding/base64"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/offen/offen/server/config"
	"github.com/sirupsen/logrus"
)

type httpConfig struct {
	port                 int
	secureCookie         bool
	development          bool
	connectionString     string
	cookieExchangeSecret string
	accountUserSalt      string
	retentionPeriod      time.Duration
}

func (h *httpConfig) Port() int                { return h.port }
func (h *httpConfig) ConnectionString() string { return h.connectionString }
func (h *httpConfig) LogLevel() logrus.Level   { return logrus.InfoLevel }
func (h *httpConfig) SecureCookie() bool       { return h.secureCookie }
func (h *httpConfig) Development() bool        { return h.development }
func (h *httpConfig) CookieExchangeSecret() []byte {
	b, _ := base64.StdEncoding.DecodeString(h.cookieExchangeSecret)
	return b
}
func (h *httpConfig) RetentionPeriod() time.Duration { return h.retentionPeriod }
func (h *httpConfig) AccountUserSalt() []byte {
	b, _ := base64.StdEncoding.DecodeString(h.accountUserSalt)
	return b
}

const (
	defaultPort = 8080
)

// New creates a new configuration for use in the context of AWS Lambda
func New() (config.Config, error) {
	cfg := httpConfig{
		port:                 defaultPort,
		connectionString:     os.Getenv("POSTGRES_CONNECTION_STRING"),
		secureCookie:         os.Getenv("SECURE_COOKIE") != "off",
		development:          os.Getenv("DEVELOPMENT") != "",
		cookieExchangeSecret: os.Getenv("COOKIE_EXCHANGE_SECRET"),
		accountUserSalt:      os.Getenv("ACCOUNT_USER_EMAIL_SALT"),
	}

	if override, ok := os.LookupEnv("PORT"); ok {
		asInt, err := strconv.Atoi(override)
		if err != nil {
			return nil, fmt.Errorf("config: error reading PORT value from environment: %v", err)
		}
		cfg.port = asInt
	}

	retention, retentionErr := time.ParseDuration(os.Getenv("EVENT_RETENTION_PERIOD"))
	if retentionErr != nil {
		return nil, fmt.Errorf("config: error reading retention period: %v", retentionErr)
	}
	cfg.retentionPeriod = retention

	return &cfg, nil
}