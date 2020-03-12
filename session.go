package aws

import (
	"os"

	"github.com/apex/log"
	a2 "github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/aws/external"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	a "github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/defaults"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/sqs"
	"github.com/guregu/dynamo"
)

var databaseServer = os.Getenv("DB")
var isDynamoDataServer = databaseServer == "" || databaseServer == "dynamodb"

func getEnvWithDefault(name, fallback string) string {
	ret := os.Getenv(name)
	if ret != "" {
		return ret
	}
	return fallback
}

func newSession(endpoint string) *session.Session {
	logLevel := a.LogOff
	if getEnvWithDefault("AWS_DEBUG", "") != "" {
		logLevel = a.LogDebugWithHTTPBody
	}

	c := defaults.Get().Config.WithLogLevel(logLevel)
	s := session.Must(session.NewSession(c))
	if endpoint != "" {
		s = s.Copy(&a.Config{
			Endpoint: a.String(endpoint),
		})
	}
	return s
}

func newConfig() a2.Config {
	c, err := external.LoadDefaultAWSConfig()
	if err != nil {
		log.WithError(err).Fatal("could not load aws config")
	}
	return c
}

func NewDynamoInstance(endpoint string) *dynamo.DB {
	if !isDynamoDataServer {
		return nil
	}
	return dynamo.New(newSession(endpoint))
}

func NewS3Instance(endpoint string) *s3.S3 {
	return s3.New(newSession(endpoint))
}

func GetQueueURL() *string {
	queueURL := os.Getenv("REPORTV1_QUEUE_URL")
	return &queueURL
}

func NewQueue(endpoint string) *sqs.SQS {
	if endpoint == "" {
		return nil
	}
	return sqs.New(newSession(endpoint))
}

func NewCloudWatch() *cloudwatch.Client {
	return cloudwatch.New(newConfig())
}
