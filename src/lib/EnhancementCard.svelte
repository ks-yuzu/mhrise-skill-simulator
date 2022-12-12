<script lang="ts">
  import Card                from '@smui/card'
  import type Enhancement    from 'mhrise-damage-simulator/enhancement'
  import EnhancementSelector from '$lib/EnhancementSelector.svelte'
  import EnhancementCheckbox from '$lib/EnhancementCheckbox.svelte'

  export let category:     string
  export let enhancements: (Enhancement[] | Enhancement)[] | undefined
  export let value:        (Enhancement | null)[]

  export let style:         string                                         = ''
  export let selectorWidth: string | ((e: Enhancement[]) => string) | null = null
  export let checkboxWidth: string | ((e: Enhancement) => string)   | null = null

  function getSelectorStyle(enhancement: Enhancement[]) {
    if      (selectorWidth == null)               { return '' }
    else if (typeof selectorWidth === 'function') { return `width: ${selectorWidth(enhancement)}` }
    else                                          { return `width: ${selectorWidth}` }
  }
  function getCheckboxStyle(enhancement: Enhancement) {
    if      (checkboxWidth == null)               { return '' }
    else if (typeof checkboxWidth === 'function') { return `width: ${checkboxWidth(enhancement)}` }
    else                                          { return `width: ${checkboxWidth}` }
  }
</script>

<Card class="card--{category}" style={style}>
  {#each enhancements ?? [] as e, i}
    {#if e.constructor.name === "Array"}
      <EnhancementSelector style={getSelectorStyle(e)}
                           enhancements={e}
                           bind:value={value[i]}
                           />
    {:else}
      <EnhancementCheckbox style={getCheckboxStyle(e)}
                           enhancement={e}
                           bind:value={value[i]}
                           isChecked={!!value[i]}
                           />
    {/if}
  {/each}
</Card>

<style>
  :global(.mdc-card) {
    display:        flex !important;
    flex-wrap:      wrap;
    flex-direction: row;
    align-items:    center;
  }
  :global(.mdc-card > .mdc-select) {
    margin: 0.2rem;
  }
</style>
