import * as cdk from "aws-cdk-lib";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { type Construct } from "constructs";

export class UploadEbsSnapshotStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const createSnapshotLambda = new lambda.Function(
      this,
      "CreateSnapshotLambda",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset("lambda"),
        handler: "create-snapshot.handler",
      }
    );

    const rule = new events.Rule(this, "Rule", {
      schedule: events.Schedule.rate(cdk.Duration.days(1)),
    });

    rule.addTarget(new targets.LambdaFunction(createSnapshotLambda));
  }
}
