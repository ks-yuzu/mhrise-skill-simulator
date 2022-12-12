<script lang="ts">
  import Select, {Option} from '@smui/select'
  import type Enhancement from 'mhrise-damage-simulator/enhancement'

  export let style = ''

  export let enhancements: Enhancement[] = []
  export let value:        Enhancement | null
</script>

<Select key={b => `${b ? b.metadata.level : ''}`}
        bind:value
        variant="filled"
        label={enhancements[0]?.metadata?.name ?? ''}
        {style}
        >
  <Option value={null}></Option>
  {#each enhancements as e}
    <Option value={e}>{`${e.metadata.level}${e.metadata.description ? " ("+e.metadata.description+")" : ""}`}</Option>
  {/each}
</Select>
