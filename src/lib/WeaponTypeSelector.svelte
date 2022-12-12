<script lang="ts">
  import Select, {Option} from '@smui/select'
  import {WEAPON_TYPES}   from '$lib/mhrise-metadata'

  export let style = ''
  export let value: string
</script>

<Select bind:value
        variant="filled"
        label="武器種"
        {style}
        >
  {#each WEAPON_TYPES as weaponType}
    <Option value={weaponType}>{weaponType}</Option>
  {/each}
</Select>
