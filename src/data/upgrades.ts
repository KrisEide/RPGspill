import type { UpgradeChoiceId } from "../game/types";

export type UpgradeChoiceDefinition = {
  id: UpgradeChoiceId;
  title: string;
  description: string;
};

export const PLACEHOLDER_UPGRADE_CHOICES: UpgradeChoiceDefinition[] = [
  {
    id: "placeholder-upgrade-1",
    title: "Upgrade Option 1",
    description: "This placeholder upgrade has no effect yet.",
  },
  {
    id: "placeholder-upgrade-2",
    title: "Upgrade Option 2",
    description: "This placeholder upgrade has no effect yet.",
  },
  {
    id: "placeholder-upgrade-3",
    title: "Upgrade Option 3",
    description: "This placeholder upgrade has no effect yet.",
  },
];
