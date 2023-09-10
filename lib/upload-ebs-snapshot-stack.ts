import { Duration, Stack, type StackProps } from "aws-cdk-lib";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Effect, Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
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

    const customPolicy = new Policy(this, "CustomPolicy", {
      statements: [
        new PolicyStatement({
          actions: [
            "ec2:DescribeInstances",
            "ec2:DescribeVolumes",
            "ec2:CreateSnapshot",
            "ec2:DescribeSnapshots",
            "ec2:DeleteSnapshot",
          ],
          effect: Effect.ALLOW,
          resources: ["*"],
        }),
      ],
    });

    if (createSnapshotLambda.role != null) {
      customPolicy.attachToRole(createSnapshotLambda.role);
    }

    const rule = new Rule(this, "Rule", {
      schedule: Schedule.rate(Duration.days(1)),
    });

    rule.addTarget(new LambdaFunction(createSnapshotLambda));
  }
}
