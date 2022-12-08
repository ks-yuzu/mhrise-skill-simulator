<script>
  import Select, {Option} from '@smui/select'

  export let style = ''

  export let enhancements = []
  export let value
</script>

<Select key={b => `${b ? b.metadata.level : ''}`}
        bind:value
        variant="filled"
        label={enhancements[0]?.metadata?.name ?? ''}
        style={style}
        >
  <Option value={null}></Option>
  {#each enhancements as e}
    <Option value={e}>{`${e.metadata.level}${e.metadata.description ? " ("+e.metadata.description+")" : ""}`}</Option>
  {/each}
</Select>
