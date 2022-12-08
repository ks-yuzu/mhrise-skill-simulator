<script lang="ts">
  import _                         from 'lodash'
  import Card                      from '@smui/card'
  import Textfield                 from '@smui/textfield'
  import Select, {Option}          from '@smui/select'

  import DamageSimulator           from 'mhrise-damage-simulator'
  import Enhancement               from 'mhrise-damage-simulator/enhancement'
  import {ITEMS}                   from 'mhrise-damage-simulator/enhancement/item'
  import {DANGOS}                  from 'mhrise-damage-simulator/enhancement/dango'
  import {SKILLS}                  from 'mhrise-damage-simulator/enhancement/skill'
  import {WEAPONS}                 from 'mhrise-damage-simulator/enhancement/weapon'
  import {QURIOUS_CRAFTS}          from 'mhrise-damage-simulator/enhancement/qurious-craft'
  import {RAMPAGE_DECORATIONS}     from 'mhrise-damage-simulator/enhancement/rampage-decoration'
  import {MISC_ENHANCEMENTS}       from 'mhrise-damage-simulator/enhancement/misc-enhancement'
  import {SHARPNESS, SHARPNESS_JP} from 'mhrise-damage-simulator/sharpness'

  import Highcharts                from '$lib/Highcharts.svelte'
  import EnhancementCard           from '$lib/EnhancementCard.svelte'
  import EnhancementSelector       from '$lib/EnhancementSelector.svelte'
  import EnhancementCheckbox       from '$lib/EnhancementCheckbox.svelte'
  import WeaponTypeSelector        from '$lib/WeaponTypeSelector.svelte'
  import {damageExpGraphSettings}  from '$lib/graph-settings'

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
    console.log('here')
    ENHANCEMENTS_MAP = getEnhancementMap(weaponType)
    selectedEnhancements = getInitialSelectedEnhancements()
  }
  function getEnhancementMap(weaponType: string) {
    return new Map([
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
  function getInitialSelectedEnhancements() {
    const tmp = {}
    for (const category of [...ENHANCEMENTS_MAP.keys()]) {
      tmp[category] = ENHANCEMENTS_MAP.get(category).map(e => {
        if (e.constructor.name === "Array") { return e.find(i => i.metadata.isEnabledByDefault) }
        else                                { return e.metadata?.isEnabledByDefault ? e : null }
      })
    }
    return tmp
  }
  let currentEnhancements = []

  const simulationParams = {
    weapon: {attack: 330, element: 42},
    sharpness: SHARPNESS.none,
    motion: {
      motionValue:     10,
      elementModifier: 1,
    },
    enhancements: [],
    monsterPartMultiplier: {physical: 55, elemental: 25},
  }
  let sim
  let expectedDamage = 0
  $: { // Enhancement 以外の更新
    const input = Object.assign({}, simulationParams)
    console.log({input})
    sim = new DamageSimulator(input)
  }
  $: { // Enhancement の更新
    currentEnhancements = Object.values(selectedEnhancements).flat().filter(i => !!i)
    console.log({currentEnhancements})
    sim.setEnhancements(currentEnhancements)
    expectedDamage = sim.calc()
    sim = sim
  }
  $: console.log({selectedEnhancements})

  let graphData = []
  $: {
    console.log({before: graphData})
    const serieses = []
    for (const [skillIdx, skills] of ENHANCEMENTS_MAP.get('skills').entries()) {
      const currentLevel = selectedEnhancements.skills[skillIdx]?.metadata?.level
      const currentLevelIndex = currentLevel != null ? skills.findIndex(i => i.metadata.level === currentLevel) : -1

      const data = Object.entries(skills.slice(currentLevelIndex + 1)).map(([i, s]) => {
        if (isNaN(s.metadata.level)) { return }

        const newEnhancementSet = _.cloneDeep(selectedEnhancements)
        newEnhancementSet.skills[skillIdx] = s
        sim.setEnhancements(flatSelectedEnhancements(newEnhancementSet))

        return {name: `Lv${s.metadata.level} (+${parseInt(s.metadata.level) - parseInt(currentLevel ?? '0')})`, y: sim.calc()}
      })
      if (data.length > 0) {
        data.unshift({name: `Lv${currentLevel}`, y: expectedDamage})
        const name = skills[0].metadata.name
        serieses.push({name, data, visible: damageExpGraphSettings.isEnabledByDefault[name] ?? true})
      }
    }

    graphData = serieses
  }

  function flatSelectedEnhancements(selectedEnhancements: {[key: string]: Enhancement[]}) {
    return Object.values(selectedEnhancements).flat().filter(i => !!i)
  }
</script>

<div>
  <div style="display: flex; flex-flow: wrap;">
    <EnhancementCard category="items"
                     enhancements={ENHANCEMENTS_MAP.get('items')}
                     bind:value={selectedEnhancements['items']}
                     style="flex-grow: 1;"
                     selectorWidth="8rem"
                     checkboxWidth={e => e.metadata.name.length < 7 ? '7rem' : ''}
                     />
    <EnhancementCard category="weapons"
                     enhancements={ENHANCEMENTS_MAP.get('weapons')}
                     bind:value={selectedEnhancements['weapons']}
                     style="flex-grow: 1000;"
                     selectorWidth="8rem"
                     checkboxWidth="8rem"
                     />
  </div>

  <div style="display: flex; flex-flow: wrap;">
    <EnhancementCard category="rampageDecorations"
                     enhancements={ENHANCEMENTS_MAP.get('rampageDecorations')}
                     bind:value={selectedEnhancements['rampageDecorations']}
                     style="flex-grow: 1;"
                     selectorWidth="16rem"
                     />
    <EnhancementCard category="quriousCrafts"
                     enhancements={ENHANCEMENTS_MAP.get('quriousCrafts')}
                     bind:value={selectedEnhancements['quriousCrafts']}
                     style="flex-grow: 1000;"
                     />
    <EnhancementCard category="dango"
                     enhancements={ENHANCEMENTS_MAP.get('dango')}
                     bind:value={selectedEnhancements['dango']}
                     style="flex-grow: 1000000;"
                     />
  </div>

  <div style="display: flex; flex-flow: wrap;">
    <EnhancementCard category="miscEnhancements"
                     enhancements={ENHANCEMENTS_MAP.get('miscEnhancements')}
                     bind:value={selectedEnhancements['miscEnhancements']}
                     style="flex-grow: 1;"
                     />
  </div>

  <div style="display: flex; flex-flow: wrap;">
    <EnhancementCard category="skills"
                     enhancements={ENHANCEMENTS_MAP.get('skills')}
                     bind:value={selectedEnhancements['skills']}
                     style="flex-grow: 1;"
                     />
  </div>

  <div style="display: flex; flex-flow: nowrap;">
    <Card style="min-width: 26rem;">
      <div id="variable-area">
        <div>
          <WeaponTypeSelector bind:value={weaponType}
                              />
        </div>

        <div>
          <Textfield style="width: 7rem" label="攻撃力" bind:value={simulationParams.weapon.attack}  variant="filled" />
          <Textfield style="width: 7rem" label="属性"   bind:value={simulationParams.weapon.element} variant="filled" />
          <Select    style="width: 7rem" label="切れ味" bind:value={simulationParams.sharpness}      variant="filled">
            {#each Object.keys(SHARPNESS_JP) as name}
              <Option value={name}>{SHARPNESS_JP[name]}</Option>
            {/each}
          </Select>
        </div>

        <div>
          <Textfield style="width: 10rem" label="モーション値"       bind:value={simulationParams.motion.motionValue}     variant="filled" />
          <Textfield style="width: 10rem" label="モーション属性補正" bind:value={simulationParams.motion.elementModifier} variant="filled" />
        </div>

        <div>
          <Textfield style="width: 10rem" label="物理肉質" bind:value={simulationParams.monsterPartMultiplier.physical}  variant="filled" />
          <Textfield style="width: 10rem" label="属性肉質" bind:value={simulationParams.monsterPartMultiplier.elemental} variant="filled" />
        </div>

        <div>
          <Textfield style="width: 7rem" label="会心率"       value={sim.affinity}                              variant="filled" />
          <Textfield style="width: 7rem" label="会心倍率"     value={1 + sim.physicalCriticalDamageMultiplier}  variant="filled" />
          <Textfield style="width: 7rem" label="属性会心倍率" value={1 + sim.elementalCriticalDamageMultiplier} variant="filled" />
        </div>

        <div>
          <Textfield style="width: 7rem" label="物理ダメージ" value={sim.physicalDamage}  variant="filled" /> +
          <Textfield style="width: 7rem" label="属性ダメージ" value={sim.elementalDamage} variant="filled" /> =
          <Textfield style="width: 7rem" label="合計ダメージ" value={expectedDamage}      variant="filled" />
        </div>
      </div>
    </Card>

    <Card style="flex: 1; overflow: hidden">
      <Highcharts series={graphData}
                  />
    </Card>
  </div>
</div>

<pre class="status">Selected: {currentEnhancements.map(i => `${i.metadata.name}${i.metadata.level !== '0' ? ':'+i.metadata.level : ''}`).join(', ')}</pre>

<style>
  #variable-area > div:nth-of-type(n+2) {
    margin-top: 0.5rem;
  }
  #variable-area > div:nth-last-of-type(2) {
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
    border-bottom-color: #ff440088; /*white;*/
  }
  :global(.mdc-select > .mdc-select__anchor:has(.mdc-select__selected-text:not(:empty)) > .mdc-line-ripple::before) {
    border-bottom-color: #ff440088; /*white;*/
  }
  /* :global(.mdc-select > .mdc-select__anchor:has(.mdc-select__selected-text:not(:empty)) > label) { */
  /*   color: white; */
  /* } */
</style>
