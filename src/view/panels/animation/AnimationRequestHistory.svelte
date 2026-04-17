<script lang="ts">
  import type {
    ICancelAnimationFrameHistory,
    IRequestAnimationFrameHistory,
  } from '../../../wrapper/AnimationWrapper.ts';
  import type { ESortOrder } from '../../../api/const.ts';
  import { saveLocalStorage } from '../../../api/storage/storage.local.ts';
  import { compareByFieldOrder } from '../shared/comparator.ts';
  import Variable from '../../shared/Variable.svelte';
  import ColumnSortable from '../shared/ColumnSortable.svelte';
  import Dialog from '../../shared/Dialog.svelte';
  import Alert from '../../shared/Alert.svelte';
  import AnimationCancelHistory from './AnimationCancelHistory.svelte';
  import { useConfigState } from '../../../state/config.state.svelte.ts';
  import AnimationRequestHistoryMetric from './AnimationRequestHistoryMetric.svelte';

  let {
    rafHistory,
    cafHistory,
    caption = '',
  }: {
    rafHistory: IRequestAnimationFrameHistory[];
    cafHistory: ICancelAnimationFrameHistory[] | null;
    caption: string;
  } = $props();
  const { sortRequestAnimationFrame } = useConfigState();
  let dialogEl: Dialog;
  let alertEl: Alert;
  const sortedMetrics = $derived.by(() =>
    rafHistory.toSorted(
      compareByFieldOrder(
        sortRequestAnimationFrame.field,
        sortRequestAnimationFrame.order,
      ),
    )
  );

  function onChangeSort(_field: string, _order: ESortOrder) {
    sortRequestAnimationFrame.field =
      <keyof IRequestAnimationFrameHistory> _field;
    sortRequestAnimationFrame.order = _order;

    saveLocalStorage({
      sortRequestAnimationFrame: $state.snapshot(sortRequestAnimationFrame),
    });
  }

  let cafHistoryMetrics: ICancelAnimationFrameHistory[] = $state([]);

  function onFindRegressors(regressors: string[] | null) {
    if (!regressors?.length) {
      return;
    }

    for (let n = regressors.length - 1; n >= 0; n--) {
      const traceId = regressors[n];
      let record = cafHistory?.find((r) => r.traceId === traceId);
      if (record) {
        cafHistoryMetrics.push(record);
      }
    }

    if (cafHistoryMetrics.length) {
      dialogEl.show();
    } else {
      alertEl.show();
    }
  }

  function onCloseDialog() {
    cafHistoryMetrics.splice(0);
  }
</script>

<Dialog
  bind:this={dialogEl}
  eventClose={onCloseDialog}
  title="Places from which requestAnimationFrame with current callstack was prematurely cancelled"
  description="The information is actual only on time of demand. Requires cancelAnimationFrame panel enabled."
>
  <AnimationCancelHistory
    caption="Cancelled by"
    cafHistory={$state.snapshot(cafHistoryMetrics)}
  />
</Dialog>

<Alert bind:this={alertEl} title="Attention">
  Requires cancelAnimationFrame panel enabled
</Alert>

<table data-navigation-tag={caption}>
  <thead class="sticky-header">
    <tr>
      <th class="w-full">
        <ColumnSortable
          field="firstSeen"
          currentField={sortRequestAnimationFrame.field}
          currentFieldOrder={sortRequestAnimationFrame.order}
          eventChangeSorting={onChangeSort}
        >
          {caption} [<Variable value={rafHistory.length} />]
        </ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          field="selfTime"
          currentField={sortRequestAnimationFrame.field}
          currentFieldOrder={sortRequestAnimationFrame.order}
          eventChangeSorting={onChangeSort}
        >Self</ColumnSortable>
      </th>
      <th class="ta-c" title="Calls per second">CPS</th>
      <th class="ta-c">
        <ColumnSortable
          field="calls"
          currentField={sortRequestAnimationFrame.field}
          currentFieldOrder={sortRequestAnimationFrame.order}
          eventChangeSorting={onChangeSort}
        >Called</ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          field="handler"
          currentField={sortRequestAnimationFrame.field}
          currentFieldOrder={sortRequestAnimationFrame.order}
          eventChangeSorting={onChangeSort}
        >Handler</ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          field="online"
          currentField={sortRequestAnimationFrame.field}
          currentFieldOrder={sortRequestAnimationFrame.order}
          eventChangeSorting={onChangeSort}
        >Set</ColumnSortable>
      </th>
      <th class="ta-c" title="Bypass"><span class="icon -bypass"></span></th>
      <th class="ta-c" title="Breakpoint">
        <span class="icon -breakpoint"></span>
      </th>
    </tr>
  </thead>

  <tbody>
    {#each sortedMetrics as metric (metric.traceId)}
      <AnimationRequestHistoryMetric {metric} {onFindRegressors} />
    {/each}
  </tbody>
</table>
