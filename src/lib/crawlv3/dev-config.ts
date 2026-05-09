import type { Crawlv3CatalogConfig } from '@/types/crawlv3'

export const CRAWLV3_DEV_CONFIG: { defaultRoomConfig: Crawlv3CatalogConfig } = {
  defaultRoomConfig: {
    csvUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vQw_jeNanf9w1oUMErdbYoDdzWK40lKHyrqQxF-kThBxcVjmXD83dCMhIP0i3IM0_NCCW4UFQckvUeH/pub?gid=878784951&single=true&output=csv',
    headers: {
      id: 'id',
      title: 'name',
      cost: 'cost',
      atk: 'atk',
      def: 'def',
      category: 'category',
      race: 'race',
      damageType: 'type',
      img: 'card_img',
      description: 'description',
    },
    imageUrlTemplate: 'https://yugioh-simulator.s3.eu-west-2.amazonaws.com/cards/{id}',
    imageOverridesText: '',
    fieldImageUrl: 'https://yugioh-simulator.s3.eu-west-2.amazonaws.com/card_art/field.png',
    statusCsvUrl:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vRwWAkxl2JNM8SOhFda9s6R5y3OSw-9Fbf0g63aGHb4hlBbZo11-9whcd7CDYYPew/pub?gid=2084882364&single=true&output=csv',
    statusHeaders: {
      id: 'id',
      name: 'name',
      type: 'type',
      description: 'description',
    },
    extraDeckCategoriesText: 'Fusion Unit, Ritual Unit',
    faceDownCategoriesText: 'Trap',
    defaultLifePoints: 40,
    defaultActionPoints: 2,
  },
}
