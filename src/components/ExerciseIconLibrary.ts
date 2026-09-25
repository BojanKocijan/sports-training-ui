import {
  IconArrowsLeftRight,
  IconAward,
  IconBallBasketball,
  IconBallVolleyball,
  IconBolt,
  IconBulb,
  IconCompass,
  IconCone,
  IconDroplet,
  IconFlame,
  IconHeart,
  IconMedal2,
  IconMoodSmile,
  IconRocket,
  IconRun,
  IconShieldHalf,
  IconStar,
  IconStopwatch,
  IconTargetArrow,
  IconTrophy,
  IconUsersGroup,
  type Icon,
} from '@tabler/icons-react'

/** The icon-library choice for a trainer's own custom exercise (sports-training-api#98) — a
 * curated, general-purpose set, distinct from CategoryIcon's category-id-keyed mapping. Each
 * key is stored as the exercise's icon_value when icon_kind is 'library'. */
export const EXERCISE_ICON_LIBRARY: Record<string, Icon> = {
  'ball-basketball': IconBallBasketball,
  'ball-volleyball': IconBallVolleyball,
  'arrows-left-right': IconArrowsLeftRight,
  'target-arrow': IconTargetArrow,
  'shield-half': IconShieldHalf,
  run: IconRun,
  'users-group': IconUsersGroup,
  flame: IconFlame,
  'mood-smile': IconMoodSmile,
  stopwatch: IconStopwatch,
  trophy: IconTrophy,
  star: IconStar,
  bolt: IconBolt,
  heart: IconHeart,
  cone: IconCone,
  compass: IconCompass,
  rocket: IconRocket,
  bulb: IconBulb,
  medal: IconMedal2,
  award: IconAward,
  droplet: IconDroplet,
}

export const EXERCISE_ICON_IDS = Object.keys(EXERCISE_ICON_LIBRARY)
