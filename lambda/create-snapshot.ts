import { type Handler } from "aws-cdk-lib/aws-lambda";
import { EC2 } from "aws-sdk";

const ec2 = new EC2();

// インスタンス名（Name タグ）に基づいてEC2インスタンスIDを取得
async function getInstanceIdsByName(instanceName: string): Promise<string[]> {
  const params = {
    Filters: [
      {
        Name: "tag:Name",
        Values: [instanceName],
      },
    ],
  };

  const data = await ec2.describeInstances(params).promise();
  const instanceIds: string[] = [];

  for (const reservation of data.Reservations ?? []) {
    for (const instance of reservation.Instances ?? []) {
      if (instance?.InstanceId !== undefined && instance.InstanceId !== "") {
        instanceIds.push(instance.InstanceId);
      }
    }
  }

  return instanceIds;
}

// インスタンス名（Name タグ）をフィルターとして使用してEBSボリュームのスナップショットを作成
export const handler: Handler = async () => {
  const instanceName = "aws-and-infra-web";

  const instanceIds = await getInstanceIdsByName(instanceName);

  for (const instanceId of instanceIds) {
    const volumes = await ec2
      .describeVolumes({
        Filters: [{ Name: "attachment.instance-id", Values: [instanceId] }],
      })
      .promise();

    const volumeIds = volumes.Volumes?.map((vol) => vol.VolumeId ?? "") ?? [];

    for (const volumeId of volumeIds) {
      if (volumeId === "") continue;

      await ec2
        .createSnapshot({
          VolumeId: volumeId,
          Description: `Snapshot for ${volumeId} in ${instanceName}`,
        })
        .promise();
    }
  }
};
