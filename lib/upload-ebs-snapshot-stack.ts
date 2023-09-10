import { Duration, Stack, type StackProps } from "aws-cdk-lib";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { type Construct } from "constructs";

export class UploadEbsSnapshotStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const createSnapshotLambda = new NodejsFunction(
      this,
      "create-snapshot-lambda",
      { runtime: Runtime.NODEJS_18_X }
    );

    const rule = new Rule(this, "Rule", {
      schedule: Schedule.rate(Duration.days(1)),
    });

    rule.addTarget(new LambdaFunction(createSnapshotLambda));
  }
}
