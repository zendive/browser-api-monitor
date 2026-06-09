export type TTerminatorsPopoverHelper = TerminatorsPopoverHelper;

const TARGET_CLASS = 'popover-target-active';
export class TerminatorsPopoverHelper {
  traceId: string | null = $state(null);
  #targetEl: HTMLElement | null = null;
  #opened: boolean = false;

  update = (traceId: string, el: EventTarget | null) => {
    if (this.#opened) {
      return;
    }

    this.traceId = traceId;
    this.#targetEl = el as HTMLElement;
    this.#targetEl?.classList.add(TARGET_CLASS);
  };

  toggle = (e: ToggleEvent) => {
    this.#opened = e.newState !== 'closed';

    if (!this.#opened) {
      this.#targetEl?.classList.remove(TARGET_CLASS);
      this.traceId = null;
      this.#targetEl = null;
    }
  };
}
