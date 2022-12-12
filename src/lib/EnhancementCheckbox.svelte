<!-- <script lang="ts"> -->
<!--   import FormField from '@smui/form-field' -->
<!--   import Checkbox  from '@smui/checkbox' -->

<!--   export let enhancement -->
<!--   export let value -->

<!--   export let isChecked = false -->
<!--   $: value = isChecked ? enhancement : null -->
<!-- </script> -->

<!-- <FormField> -->
<!--   <Checkbox bind:checked={isChecked} -->
<!--             variant="filled" -->
<!--             /> -->
<!--   <span slot="label">{enhancement.metadata.name}</span> -->
<!-- </FormField> -->


<script lang="ts">
  import Button, {Label}  from '@smui/button'
  import type Enhancement from 'mhrise-damage-simulator/enhancement'

  export let style = ''

  export let enhancement: Enhancement
  export let value:       Enhancement | null

  export let isChecked: boolean = !!value
  $: value = isChecked ? enhancement : null
</script>


<Button color={isChecked ? undefined : "secondary"}
        on:click={() => {isChecked = !isChecked}}
        {style}
        >
  <Label>{enhancement.metadata.name}</Label>
</Button>


<style>
  :global(.mdc-button:not(:disabled)) {
    background-color: #2a2a2e !important;
    padding: 1rem;
    margin: 0.2rem;
  }

  :global(.mdc-button.smui-button--color-secondary:not(:disabled)) {
    color: rgba(255,255,255,0.6);
  }
</style>
