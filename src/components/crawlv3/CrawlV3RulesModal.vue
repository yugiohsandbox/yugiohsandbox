<script setup lang="ts">
import { ref } from 'vue'

type RuleList = {
  title: string
  items: string[]
}

type RuleRow = {
  label: string
  sublabel?: string
  description: string
}

type RuleTable = {
  title?: string
  columns?: [string, string]
  compactLabelColumn?: boolean
  rows: RuleRow[]
}

type RuleSection = {
  title: string
  summary: string
  defaultOpen?: boolean
  lists?: RuleList[]
  tables?: RuleTable[]
}

type HighlightedTextPart = {
  text: string
  isKeyword: boolean
}

const emit = defineEmits<{
  (e: 'close'): void
}>()

const ruleKeywords = [
  'Target in Defense Stance',
  'Target in Attack Stance',
  'Protected Units',
  'Recovery Phase',
  'Defense Stance',
  'Attack Stance',
  'Battle Phase',
  'Setup Phase',
  'Extra Deck Units',
  'Extra Deck',
  'Discard Pile',
  'Action Points',
  'Hit Points',
  'Rune Counters',
  'Fusion Summon',
  'Ritual Units',
  'Fusion Units',
  'Unit Abilities',
  'Unit Stance',
  'Damage Type',
  'Battle Position',
  'Effective Against',
  'On Reaction',
  'On Destroy',
  'On Summon',
  'Attacker Higher',
  'Attacker Equal',
  'Attacker Lower',
  'Paralyzed',
  'Debilitated',
  'Infiltrate',
  'Lightning',
  'Physical',
  'Heavenly',
  'Necrotic',
  'Piercing',
  'Revealed',
  'Immobile',
  'Tributing',
  'Summoning',
  'Sacrificing',
  'Sacrificed',
  'Sacrifice',
  'Summoned',
  'Summon',
  'Playing',
  'Setting',
  'Buffs',
  'Debuffs',
  'Attack',
  'Defense',
  'Cleanse',
  'Cursed',
  'Poison',
  'Retain',
  'Eternal',
  'Angered',
  'Cleave',
  'Medic',
  'Nimble',
  'Manual',
  'Perpetual',
  'Ritual',
  'Fusion',
  'Traps',
  'Effects',
  'Powers',
  'Units',
  'Unit',
  'Zones',
  'Zone',
  'Deck',
  'Play',
  'Set',
  'Race',
  'Type',
  'Water',
  'Fire',
  'Earth',
  'God',
  'Rune',
  'Burn',
  'Blind',
  'ATK/DEF',
]

const keywordRegex = new RegExp(
  `(${ruleKeywords
    .map((keyword) => keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length)
    .join('|')})`,
  'g',
)

function highlightedText(text: string): HighlightedTextPart[] {
  return text
    .split(keywordRegex)
    .filter(Boolean)
    .map((part) => ({
      text: part,
      isKeyword: ruleKeywords.includes(part),
    }))
}

const ruleSections: RuleSection[] = [
  {
    title: 'General Play',
    summary: 'Starting resources, drawing cards, turn flow, and the win condition.',
    defaultOpen: false,
    lists: [
      {
        title: 'Game Setup',
        items: [
          'Cards start in your Deck or Extra Deck, depending on their card type.',
          'Each player starts the game with 40 Hit Points.',
          "Your goal is to reduce your opponent's Hit Points to 0.",
        ],
      },
      {
        title: 'Turn Basics',
        items: [
          'You start each turn with 2 Action Points.',
          'At the start of your turn, draw 4 cards.',
          'If your Deck is empty when you need to draw, shuffle your Discard Pile into your Deck. Extra Deck Units return to the Extra Deck.',
          'At the end of your turn, discard the cards remaining in your hand.',
        ],
      },
      {
        title: 'Turn Phases',
        items: [
          'Setup Phase: Summon Units, Set Traps, Play or Set Effects, Play Powers, Sacrifice Units, and change Unit Stance.',
          "Battle Phase: attack your opponent's Units.",
          'Recovery Phase: you may do anything allowed in the Setup Phase, except changing Unit Stance.',
        ],
      },
    ],
  },
  {
    title: 'Cards & Zones',
    summary: 'How card types are played and where they go on the board.',
    defaultOpen: false,
    lists: [
      {
        title: 'Costs & Decks',
        items: [
          'Playing, Summoning, or Setting a card requires paying its cost. Most cards use Action Points as their cost.',
          'Ritual Units require Tributing a Unit with the required number of Rune Counters.',
          'Fusion Units require Tributing other Units as materials, plus another card that allows the Fusion Summon.',
          'Ritual and Fusion Units are kept in a separate Deck called the Extra Deck.',
          'Units have Race and Type properties.',
        ],
      },
      {
        title: 'Board Placement',
        items: [
          'Units are Summoned face up in the brown Zones.',
          'Traps are Set face down in the red Zones.',
          'Powers are Set face up in the blue Zones.',
          'Effects can be played directly from the hand or Set face down in the red Zones.',
          'Effects Set on the field can be played for free on your turn, but not on the turn they were Set.',
          "Traps can only be activated on your opponent's turn.",
        ],
      },
    ],
  },
  {
    title: 'Card Effects',
    summary: 'Sacrificing Units and the five ability trigger types.',
    lists: [
      {
        title: 'Sacrifice',
        items: [
          'Sacrificing a Unit destroys it and gives you +1 Action Point.',
          'A Unit cannot be Sacrificed on the turn it was Summoned.',
        ],
      },
      {
        title: 'Unit Abilities',
        items: ['Most Units have abilities. Each ability is triggered in one of the ways listed below.'],
      },
    ],
    tables: [
      {
        rows: [
          {
            label: 'On Summon',
            description: 'Triggers when the card is Summoned to the field.',
          },
          {
            label: 'On Destroy',
            description:
              'Triggers when the Unit is destroyed, but not when it is Sacrificed or used as Summon material.',
          },
          {
            label: 'On Reaction',
            description: 'Triggers when the specific action described on the card happens.',
          },
          {
            label: 'Manual',
            description: 'Can be triggered by the player once the card is on the field.',
          },
          {
            label: 'Perpetual',
            description: 'Applies continuously while the card is on the field.',
          },
        ],
      },
    ],
  },
  {
    title: 'Battle',
    summary: 'Attack declarations, stance checks, and battle outcomes.',
    lists: [
      {
        title: 'Declaring Attacks',
        items: [
          "During the Battle Phase, each Unit in Attack Stance can declare one attack against an opponent's Unit.",
          'If the target is in Attack Stance, use its Attack value for damage calculation.',
          'If the target is in Defense Stance, use its Defense value for damage calculation.',
        ],
      },
    ],
    tables: [
      {
        rows: [
          {
            label: 'Target in Attack Stance',
            sublabel: 'Attacker Higher',
            description:
              "The targeted Unit is destroyed, and that Unit's owner loses Hit Points equal to the difference between the two Attack values.",
          },
          {
            label: 'Target in Attack Stance',
            sublabel: 'Attacker Equal',
            description: 'Both Units are destroyed.',
          },
          {
            label: 'Target in Attack Stance',
            sublabel: 'Attacker Lower',
            description:
              "The attacking Unit is destroyed, and that Unit's owner loses Hit Points equal to the difference between the two Attack values.",
          },
          {
            label: 'Target in Defense Stance',
            sublabel: 'Attacker Higher',
            description: 'The targeted Unit is destroyed.',
          },
          {
            label: 'Target in Defense Stance',
            sublabel: 'Attacker Equal',
            description: 'Neither Unit is destroyed.',
          },
          {
            label: 'Target in Defense Stance',
            sublabel: 'Attacker Lower',
            description:
              "The attacking Unit's owner loses Hit Points equal to the difference between their Unit's Attack and the targeted Unit's Defense.",
          },
        ],
      },
    ],
  },
  {
    title: 'Types',
    summary: 'Damage type advantages used during battle.',
    lists: [
      {
        title: 'Type Advantage',
        items: [
          'Each Unit has a Damage Type.',
          "When Units battle, if either Unit's Type is effective against the other, the Unit with the effective Type gains +4 ATK/DEF for damage calculation.",
        ],
      },
    ],
    tables: [
      {
        columns: ['Type', 'Effective Against'],
        rows: [
          { label: 'Water', description: 'Fire' },
          { label: 'Fire', description: 'Earth' },
          { label: 'Earth', description: 'Lightning' },
          { label: 'Lightning', description: 'Water' },
          { label: 'Heavenly', description: 'Necrotic' },
          { label: 'Necrotic', description: 'Physical' },
          { label: 'Physical', description: 'Heavenly' },
          { label: 'God', description: 'Nothing' },
        ],
      },
    ],
  },
  {
    title: 'Status Effects',
    summary: 'Buffs and debuffs that can be applied to cards.',
    tables: [
      {
        title: 'Buffs',
        compactLabelColumn: true,
        rows: [
          {
            label: 'Rune',
            description:
              'You can destroy a Unit with Rune to Summon a Ritual Unit from the Extra Deck whose cost is equal to or lower than the Rune value on that Unit.',
          },
          {
            label: 'Retain',
            description:
              'This card is not discarded at the end of your turn. At the start of your turn, reduce Retain by 1.',
          },
          {
            label: 'Eternal',
            description:
              'The first time this Unit would be destroyed, it is not destroyed. Remove 1 Eternal from the Unit instead.',
          },
          {
            label: 'Angered',
            description: 'When this Unit attacks, it attacks both enemy Units in its column. Reduce Cleave by 1.',
          },
          {
            label: 'Piercing',
            description:
              "If this Unit attacks a Unit in Defense Stance, excess attack damage is removed from the opponent's Hit Points. Reduce Piercing by 1.",
          },
          {
            label: 'Cleanse',
            description:
              'When applied, remove any debuffs from the Unit. If a new debuff would be applied, prevent it and reduce Cleanse by 1.',
          },
          {
            label: 'Cleave',
            description:
              "This Unit's attacks are applied to both Units in an opponent's column. Reduce Cleave by 1 when it attacks.",
          },
          {
            label: 'Medic',
            description:
              'At the start of your turn, increase your Hit Points by the Medic value on this card, then reduce Medic by 1.',
          },
          {
            label: 'Infiltrate',
            description:
              'This Unit can target Protected Units. If it attacks a Protected Unit, reduce Infiltrate by 1.',
          },
          {
            label: 'Nimble',
            description: 'Once per turn, this Unit can move to an adjacent Zone. Reduce Nimble by 1.',
          },
        ],
      },
      {
        title: 'Debuffs',
        compactLabelColumn: true,
        rows: [
          {
            label: 'Revealed',
            description: 'A card with Revealed is face up.',
          },
          {
            label: 'Burn',
            description:
              'If this Unit attacks, you lose Hit Points equal to its Burn value, then remove all Burn from it.',
          },
          {
            label: 'Paralyzed',
            description:
              'This Unit cannot declare an attack or change Battle Position. At the end of your turn, reduce Paralyzed by 1.',
          },
          {
            label: 'Cursed',
            description:
              'When applied, remove any buffs from this Unit. If a new buff would be applied, prevent it and reduce Cursed by 1.',
          },
          {
            label: 'Poison',
            description:
              'At the end of your turn, reduce your Hit Points by the Poison value on this card, then reduce Poison by 1.',
          },
          {
            label: 'Blind',
            description: 'This Unit cannot choose which Unit it attacks. If this Unit attacks, reduce Blind by 1.',
          },
          {
            label: 'Immobile',
            description: 'This Unit cannot change position. At the end of your turn, reduce Immobile by 1.',
          },
          {
            label: 'Debilitated',
            description: 'This Unit cannot use its ability. At the end of your turn, reduce Debilitated by 1.',
          },
        ],
      },
    ],
  },
]

const openSections = ref(new Set(ruleSections.filter((section) => section.defaultOpen).map((section) => section.title)))

function isSectionOpen(title: string) {
  return openSections.value.has(title)
}

function toggleSection(title: string) {
  const nextOpenSections = new Set(openSections.value)
  if (nextOpenSections.has(title)) {
    nextOpenSections.delete(title)
  } else {
    nextOpenSections.add(title)
  }
  openSections.value = nextOpenSections
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-1000 flex items-center bg-black/75 p-4 backdrop-blur-sm" @click="emit('close')">
      <div
        class="mx-auto max-h-[calc(100vh-2rem)] w-full max-w-5xl overflow-y-auto rounded-[1.75rem] border border-white/10 bg-neutral-950/95 p-6 text-white shadow-2xl"
        @click.stop
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-xs font-semibold tracking-[0.35em] text-white/45 uppercase">Reference</p>
            <h2 class="mt-2 text-2xl font-semibold">Crawl V3 Rules</h2>
            <p class="mt-2 max-w-2xl text-sm leading-6 text-white/60">
              A quick in-game reference for turn structure, card rules, battle outcomes, type matchups, and statuses.
            </p>
          </div>
          <button
            type="button"
            class="cursor-pointer rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
            @click="emit('close')"
          >
            Close
          </button>
        </div>

        <div class="mt-6 space-y-3">
          <section
            v-for="section in ruleSections"
            :key="section.title"
            class="group overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/5"
            :class="{ 'is-open': isSectionOpen(section.title) }"
          >
            <button
              type="button"
              class="flex w-full cursor-pointer items-start justify-between gap-4 px-4 py-4 text-left transition hover:bg-white/5"
              :aria-expanded="isSectionOpen(section.title)"
              @click="toggleSection(section.title)"
            >
              <span>
                <span class="block text-sm font-semibold tracking-[0.24em] text-amber-100/80 uppercase">
                  {{ section.title }}
                </span>
                <span class="mt-1 block text-sm leading-5 text-white/58">{{ section.summary }}</span>
              </span>
              <span
                class="relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/12 text-white/70 transition group-hover:border-white/25"
              >
                <span class="absolute h-0.5 w-3 rounded-full bg-current"></span>
                <span
                  class="absolute h-3 w-0.5 rounded-full bg-current transition-transform duration-200 group-[.is-open]:scale-y-0"
                ></span>
              </span>
            </button>

            <div
              class="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-[.is-open]:grid-rows-[1fr]"
            >
              <div class="min-h-0 overflow-hidden">
                <div
                  class="space-y-5 border-t border-white/10 px-4 py-5 opacity-0 transition-opacity duration-200 group-[.is-open]:opacity-100"
                >
                  <div v-if="section.lists?.length" class="grid gap-4 md:grid-cols-2">
                    <section
                      v-for="list in section.lists"
                      :key="`${section.title}-${list.title}`"
                      class="rounded-2xl bg-black/18 p-4"
                    >
                      <h3 class="text-sm font-semibold text-white/86">{{ list.title }}</h3>
                      <ul class="mt-3 space-y-2 text-sm leading-6 text-white/68">
                        <li v-for="item in list.items" :key="item" class="flex gap-2">
                          <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-200/70"></span>
                          <span>
                            <template v-for="(part, partIndex) in highlightedText(item)" :key="`${item}-${partIndex}`">
                              <strong v-if="part.isKeyword" class="font-semibold text-white/88">{{ part.text }}</strong>
                              <template v-else>{{ part.text }}</template>
                            </template>
                          </span>
                        </li>
                      </ul>
                    </section>
                  </div>

                  <div
                    v-if="section.tables?.length"
                    class="grid gap-4"
                    :class="{ 'lg:grid-cols-2': section.tables.length > 1 }"
                  >
                    <section
                      v-for="table in section.tables"
                      :key="`${section.title}-${table.title ?? 'table'}`"
                      class="overflow-hidden rounded-2xl border border-white/10 bg-black/18"
                    >
                      <h3
                        v-if="table.title"
                        class="border-b border-white/10 px-4 py-3 text-sm font-semibold tracking-[0.18em] text-amber-100/75 uppercase"
                      >
                        {{ table.title }}
                      </h3>
                      <div
                        v-if="table.columns"
                        class="grid gap-2 border-b border-white/10 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-sky-100/55 uppercase md:grid-cols-[13rem_minmax(0,1fr)]"
                      >
                        <span>
                          <template
                            v-for="(part, partIndex) in highlightedText(table.columns[0])"
                            :key="`${table.columns[0]}-${partIndex}`"
                          >
                            <strong v-if="part.isKeyword" class="font-semibold text-sky-100/75">{{ part.text }}</strong>
                            <template v-else>{{ part.text }}</template>
                          </template>
                        </span>
                        <span>
                          <template
                            v-for="(part, partIndex) in highlightedText(table.columns[1])"
                            :key="`${table.columns[1]}-${partIndex}`"
                          >
                            <strong v-if="part.isKeyword" class="font-semibold text-sky-100/75">{{ part.text }}</strong>
                            <template v-else>{{ part.text }}</template>
                          </template>
                        </span>
                      </div>
                      <table v-if="table.compactLabelColumn" class="w-full table-auto border-collapse">
                        <tbody>
                          <tr
                            v-for="row in table.rows"
                            :key="`${section.title}-${table.title ?? 'table'}-${row.label}`"
                            class="border-t border-white/8 align-top first:border-t-0"
                          >
                            <th
                              scope="row"
                              class="w-0 px-4 py-3 pr-5 text-left text-sm font-semibold whitespace-nowrap text-white/88"
                            >
                              <template
                                v-for="(part, partIndex) in highlightedText(row.label)"
                                :key="`${row.label}-${partIndex}`"
                              >
                                <strong v-if="part.isKeyword" class="font-semibold text-white/95">{{
                                  part.text
                                }}</strong>
                                <template v-else>{{ part.text }}</template>
                              </template>
                            </th>
                            <td class="px-4 py-3 text-sm leading-6 text-white/66">
                              <template
                                v-for="(part, partIndex) in highlightedText(row.description)"
                                :key="`${row.label}-description-${partIndex}`"
                              >
                                <strong v-if="part.isKeyword" class="font-semibold text-white/88">{{
                                  part.text
                                }}</strong>
                                <template v-else>{{ part.text }}</template>
                              </template>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <template v-else>
                        <div
                          v-for="row in table.rows"
                          :key="`${section.title}-${table.title ?? 'table'}-${row.label}`"
                          class="grid gap-2 border-t border-white/8 px-4 py-3 first:border-t-0 md:grid-cols-[13rem_minmax(0,1fr)]"
                        >
                          <div>
                            <p class="text-sm font-semibold text-white/88">
                              <template
                                v-for="(part, partIndex) in highlightedText(row.label)"
                                :key="`${row.label}-${partIndex}`"
                              >
                                <strong v-if="part.isKeyword" class="font-semibold text-white/95">{{
                                  part.text
                                }}</strong>
                                <template v-else>{{ part.text }}</template>
                              </template>
                            </p>
                            <p
                              v-if="row.sublabel"
                              class="mt-0.5 text-xs font-semibold tracking-[0.18em] text-sky-100/55 uppercase"
                            >
                              <template
                                v-for="(part, partIndex) in highlightedText(row.sublabel)"
                                :key="`${row.sublabel}-${partIndex}`"
                              >
                                <strong v-if="part.isKeyword" class="font-semibold text-sky-100/75">{{
                                  part.text
                                }}</strong>
                                <template v-else>{{ part.text }}</template>
                              </template>
                            </p>
                          </div>
                          <p class="text-sm leading-6 text-white/66">
                            <template
                              v-for="(part, partIndex) in highlightedText(row.description)"
                              :key="`${row.label}-description-${partIndex}`"
                            >
                              <strong v-if="part.isKeyword" class="font-semibold text-white/88">{{ part.text }}</strong>
                              <template v-else>{{ part.text }}</template>
                            </template>
                          </p>
                        </div>
                      </template>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </Teleport>
</template>
