<script lang="ts">
  import _                          from 'lodash'
  import Card                       from '@smui/card'
  import Textfield                  from '@smui/textfield'
  import Select, {Option}           from '@smui/select'

  import DamageSimulator            from 'mhrise-damage-simulator'
  import type Enhancement           from 'mhrise-damage-simulator/enhancement'
  import {ITEMS}                    from 'mhrise-damage-simulator/enhancement/item'
  import {DANGOS}                   from 'mhrise-damage-simulator/enhancement/dango'
  import {SKILLS}                   from 'mhrise-damage-simulator/enhancement/skill'
  import {WEAPONS}                  from 'mhrise-damage-simulator/enhancement/weapon'
  import {QURIOUS_CRAFTS}           from 'mhrise-damage-simulator/enhancement/qurious-craft'
  import {RAMPAGE_DECORATIONS}      from 'mhrise-damage-simulator/enhancement/rampage-decoration'
  import {MISC_ENHANCEMENTS}        from 'mhrise-damage-simulator/enhancement/misc-enhancement'
  import {SHARPNESS, SHARPNESS_JP}  from 'mhrise-damage-simulator/sharpness'

  import Highcharts                 from '$lib/Highcharts.svelte'
  import WeaponTypeSelector         from '$lib/WeaponTypeSelector.svelte'
  import EnhancementCard            from '$lib/EnhancementCard.svelte'
  import {damageExpGraphSettings}   from '$lib/graph-settings'
  import {BLADEMASTER_WEAPON_TYPES} from '$lib/mhrise-metadata'

  let weaponType = '弓'
  const enhancementReducer = (acc, cur) => {
    if (cur.metadata.level === '0') {
      acc.push(cur)
    }
    else {
      const targetArray = acc.find(i => i[0]?.metadata?.name === cur.metadata.name)
      if (targetArray != null) { targetArray.push(cur) }
      else                     { acc.push([cur]) }
    }
    return acc
  }
  let ENHANCEMENTS_MAP = getEnhancementMap(weaponType)
  $: {
    ENHANCEMENTS_MAP = getEnhancementMap(weaponType)
    selectedEnhancements = getInitialSelectedEnhancements()
    simulationParams.sharpness = BLADEMASTER_WEAPON_TYPES.includes(weaponType) ? SHARPNESS.white : SHARPNESS.none
  }
  function getEnhancementMap(weaponType: string) {
    return new Map<string, (Enhancement|Enhancement[])[]>([
      ['items',              ITEMS              .filter(i => i.metadata.weaponFilter.length == 0 || i.metadata.weaponFilter.includes(weaponType)).reduce(enhancementReducer, [])],
      ['dango',              DANGOS             .filter(i => i.metadata.weaponFilter.length == 0 || i.metadata.weaponFilter.includes(weaponType)).reduce(enhancementReducer, [])],
      ['quriousCrafts',      QURIOUS_CRAFTS     .filter(i => i.metadata.weaponFilter.length == 0 || i.metadata.weaponFilter.includes(weaponType)).reduce(enhancementReducer, [])],
      ['weapons',            WEAPONS            .filter(i => i.metadata.weaponFilter.length == 0 || i.metadata.weaponFilter.includes(weaponType)).reduce(enhancementReducer, [])],
      ['skills',             SKILLS             .filter(i => i.metadata.weaponFilter.length == 0 || i.metadata.weaponFilter.includes(weaponType)).reduce(enhancementReducer, [])],
      ['rampageDecorations', RAMPAGE_DECORATIONS.filter(i => i.metadata.weaponFilter.length == 0 || i.metadata.weaponFilter.includes(weaponType)).reduce(enhancementReducer, [])],
      ['miscEnhancements',   MISC_ENHANCEMENTS  .filter(i => i.metadata.weaponFilter.length == 0 || i.metadata.weaponFilter.includes(weaponType)).reduce(enhancementReducer, [])],
    ])
  }

  let selectedEnhancements: {[key: string]: Enhancement[]} = getInitialSelectedEnhancements()
  function getInitialSelectedEnhancements(): {[key: string]: Enhancement[]} {
    const tmp = {}
    for (const category of [...ENHANCEMENTS_MAP.keys()]) {
      tmp[category] = ENHANCEMENTS_MAP.get(category)?.map(e => {
        if (e.constructor.name === "Array") { return e.find(i => i.metadata.isEnabledByDefault) }
        else                                { return e.metadata?.isEnabledByDefault ? e : null }
      })
    }
    return tmp
  }
  let currentEnhancements = []

  const simulationParams = {
    weapon:                {attack: 330, element: 42, affinity: 0},
    sharpness:             SHARPNESS.none,
    motion:                {motionValue: 10, elementModifier: 1},
    enhancements:          [],
    monsterPartMultiplier: {physical: 55, elemental: 25},
  }
  let sim: DamageSimulator = null
  let expectedDamage       = 0
  // Enhancement 以外の更新
  $: sim = new DamageSimulator(simulationParams)
  $: { // Enhancement の更新
    currentEnhancements = Object.values(selectedEnhancements).flat().filter(i => !!i)
    sim.setEnhancements(currentEnhancements)
    expectedDamage = sim.calc()
    sim = sim
  }
  $: console.log({selectedEnhancements})

  let graphData: Highcharts.SeriesLineOptions[] = []
  $: {
    const expectedDamageInReal = sim.calcInRealNumbers()

    const serieses = []
    for (const [skillIdx, skills] of ENHANCEMENTS_MAP.get('skills')?.entries() ?? []) {
      const currentLevel = selectedEnhancements.skills[skillIdx]?.metadata?.level
      const currentLevelIndex = currentLevel != null ? skills.findIndex(i => i.metadata.level === currentLevel) : -1

      // const data = Object.entries(skills.slice(currentLevelIndex + 1)).map(([i, s]) => {
      const data = skills.slice(currentLevelIndex + 1).map(s => {
        if (isNaN(s.metadata.level)) { return }

        const newEnhancementSet = _.cloneDeep(selectedEnhancements)
        newEnhancementSet.skills[skillIdx] = s
        sim.setEnhancements(flatSelectedEnhancements(newEnhancementSet))

        return {name: `Lv${s.metadata.level} (+${parseInt(s.metadata.level) - parseInt(currentLevel ?? '0')})`, y: sim.calcInRealNumbers()}
      })
      if (data.length > 0) { // series が減ると末尾に古いものが残るので, 点が無くてもスキップはしない
        data.unshift({name: `Lv${currentLevel}`, y: expectedDamageInReal})
      }
      const name = skills[0].metadata.name
      serieses.push({name, data, visible: damageExpGraphSettings.isEnabledByDefault[name] ?? true})
    }

    graphData = serieses
  }

  function flatSelectedEnhancements(selectedEnhancements: {[key: string]: Enhancement[]}) {
    return Object.values(selectedEnhancements).flat().filter(i => !!i)
  }

</script>

<div>
  <div class="wrappable-flex">
    <Card>
      <WeaponTypeSelector bind:value={weaponType}
                          style="width: 10rem;"
                          />
    </Card>

    <EnhancementCard category="weapons"
                     enhancements={ENHANCEMENTS_MAP.get('weapons')}
                     bind:value={selectedEnhancements['weapons']}
                     selectorWidth="8rem"
                     checkboxWidth="8rem"
                     />
    <EnhancementCard category="items"
                     enhancements={ENHANCEMENTS_MAP.get('items')}
                     bind:value={selectedEnhancements['items']}
                     selectorWidth="8rem"
                     checkboxWidth={e => e.metadata.name.length < 7 ? '7rem' : ''}
                     />
  </div>

  <div class="wrappable-flex">
    <EnhancementCard category="rampageDecorations"
                     enhancements={ENHANCEMENTS_MAP.get('rampageDecorations')}
                     bind:value={selectedEnhancements['rampageDecorations']}
                     selectorWidth="15rem"
                     />
    <EnhancementCard category="quriousCrafts"
                     enhancements={ENHANCEMENTS_MAP.get('quriousCrafts')}
                     bind:value={selectedEnhancements['quriousCrafts']}
                     />
    <EnhancementCard category="dango"
                     enhancements={ENHANCEMENTS_MAP.get('dango')}
                     bind:value={selectedEnhancements['dango']}
                     />
  </div>

  <div class="wrappable-flex">
    <EnhancementCard category="miscEnhancements"
                     enhancements={ENHANCEMENTS_MAP.get('miscEnhancements')}
                     bind:value={selectedEnhancements['miscEnhancements']}
                     selectorWidth="12rem"
                     />
  </div>

  <div class="wrappable-flex">
    <EnhancementCard category="skills"
                     enhancements={ENHANCEMENTS_MAP.get('skills')}
                     bind:value={selectedEnhancements['skills']}
                     />
  </div>

  <div class="wrappable-flex">
    <Card style="min-width: 26rem;">
      <div id="variable-area">
        <div>
          <Textfield style="width: 7rem" label="攻撃力"     type="number" bind:value={simulationParams.weapon.attack}   variant="filled" />
          <Textfield style="width: 7rem" label="属性値"     type="number" bind:value={simulationParams.weapon.element}  variant="filled" />
          <Textfield style="width: 7rem" label="武器会心率" type="number" bind:value={simulationParams.weapon.affinity} variant="filled" />
          {#if BLADEMASTER_WEAPON_TYPES.includes(weaponType)}
          <Select    style="width: 7rem" label="切れ味"     type="number" bind:value={simulationParams.sharpness}       variant="filled">
            {#each Object.keys(SHARPNESS_JP) as name}
              <Option value={name}>{SHARPNESS_JP[name]}</Option>
            {/each}
          </Select>
          {/if}
        </div>

        <div>
          <Textfield style="width: 10rem" label="モーション値"       type="number" bind:value={simulationParams.motion.motionValue}     variant="filled" />
          <Textfield style="width: 10rem" label="モーション属性補正" type="number" bind:value={simulationParams.motion.elementModifier} variant="filled" />
        </div>

        <div>
          <Textfield style="width: 10rem" label="物理肉質" type="number" bind:value={simulationParams.monsterPartMultiplier.physical}  variant="filled" />
          <Textfield style="width: 10rem" label="属性肉質" type="number" bind:value={simulationParams.monsterPartMultiplier.elemental} variant="filled" />
        </div>

        <div>
          <Textfield style="width: 7rem" label="実質攻撃力" value={'-'} variant="filled" disabled/>
          <Textfield style="width: 7rem" label="実質属性値" value={'-'} variant="filled" disabled/>
          <Textfield style="width: 7rem" label="実質会心率" value={sim.affinity}                              variant="filled" />
        </div>

        <div>
          <Textfield style="width: 10rem" label="会心倍率"     value={1 + sim.physicalCriticalDamageMultiplier}  variant="filled" />
          <Textfield style="width: 10rem" label="属性会心倍率" value={1 + sim.elementalCriticalDamageMultiplier} variant="filled" />
        </div>

        <div>
          <Textfield style="width: 7rem" label="物理ダメージ" value={Math.round(sim.physicalDamage)}  variant="filled" /> +
          <Textfield style="width: 7rem" label="属性ダメージ" value={Math.round(sim.elementalDamage)} variant="filled" /> =
          <Textfield style="width: 7rem" label="合計ダメージ" value={expectedDamage}                  variant="filled" />
        </div>
      </div>
    </Card>

    <Card style="width: calc(100% - 34rem); min-width: 600px; overflow: hidden">
      <Highcharts series={graphData}
                  onClick={(x, {}={}, pointName, seriesName) => {
                    const skill = seriesName
                    const level = pointName.replace(/Lv(\w)\s+\(.*\)/, '$1')
                    console.log({skill, level})
                  }}
                  />
    </Card>
  </div>
</div>

<!-- <pre class="status">Selected: {currentEnhancements.map(i => `${i.metadata.name}${i.metadata.level !== '0' ? ':'+i.metadata.level : ''}`).join(', ')}</pre> -->

<style>
  :global(
    input[type="number"]::-webkit-outer-spin-button,
    input[type="number"]::-webkit-inner-spin-button
  ) {
    -webkit-appearance: none;
    margin: 0;
  }

  div.wrappable-flex {
    display:   flex;
    flex-flow: wrap;
  }
  :global(div.wrappable-flex > div:first-of-type) {
    flex-grow: 1;
  }
  :global(div.wrappable-flex > div:nth-of-type(2)) {
    flex-grow: 1000;
  }
  :global(div.wrappable-flex > div:nth-of-type(3)) {
    flex-grow: 1000000;
  }

  #variable-area > div {
    margin-top: 0.5rem;
  }
  #variable-area > div:nth-last-of-type(3) {
    margin-top: 1.5rem;
  }
  :global(#variable-area > div > .mdc-select) {
    margin: 0 0.2
  }

  :global(.mdc-card) {
    display: block;
    margin:  0.4rem 0.3rem;
    padding: 0.5rem;
  }

  :global(.mdc-text-field:has(> input:not(:placeholder-shown)) > .mdc-line-ripple::before) {
    border-bottom-color: #ff440088;
  }
  :global(.mdc-select > .mdc-select__anchor:has(.mdc-select__selected-text:not(:empty)) > .mdc-line-ripple::before) {
    border-bottom-color: #ff440088;
  }
  /* :global(.mdc-select > .mdc-select__anchor:has(.mdc-select__selected-text:not(:empty)) > label) { */
  /*   color: white; */
  /* } */
</style>
