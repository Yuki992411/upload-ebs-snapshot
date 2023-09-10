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

// 同じボリューム内で直近n個のスナップショットを保存するために最も古いのを削除
async function removeOldestSnapshotOf({
  volumeId,
  remainSnapshotNumInVolume,
}: {
  volumeId: string;
  remainSnapshotNumInVolume: number;
}): Promise<void> {
  const params = {
    Filters: [
      {
        Name: "volume-id",
        Values: [volumeId],
      },
    ],
  };

  const res = await ec2.describeSnapshots(params).promise();

  if (res.Snapshots === undefined) {
    throw new Error("Snapshots is undef !!");
  }

  res.Snapshots.sort((a, b) => {
    if (a.StartTime === undefined || b.StartTime === undefined) {
      throw new Error("StartTime is undefined for one or both snapshots !");
    }

    return new Date(a.StartTime).getTime() - new Date(b.StartTime).getTime();
  });

  if (
    !(res.Snapshots[0] == null) &&
    res.Snapshots.length > remainSnapshotNumInVolume
  ) {
    const deleteSnapshotId = res.Snapshots[0].SnapshotId ?? "";

    if (deleteSnapshotId !== "") {
      await ec2
        .deleteSnapshot({
          SnapshotId: deleteSnapshotId,
        })
        .promise();
    }
  }
}

// インスタンス名（Name タグ）をフィルターとして使用してEBSボリュームのスナップショットを作成
// 同じボリューム内で直近n個のスナップショットを保存
export const handler: Handler = async () => {
  const instanceName = "aws-and-infra-web";
  const remainSnapshotNumInVolume = 5;

  try {
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

        await removeOldestSnapshotOf({
          volumeId,
          remainSnapshotNumInVolume,
        });
      }
    }
  } catch (err: any) {
    throw new Error(`An error occurred (エラー発生): ${err.message}`);
  }
};
