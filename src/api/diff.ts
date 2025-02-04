import { create, DiffPatcher } from 'jsondiffpatch';
export type { Delta } from 'jsondiffpatch';

const patcher = create({
  // used to match objects when diffing arrays, by default only === operator is used
  objectHash(obj: any, index) {
    // this function is used only to when objects are not equal by ref
    return obj?.traceId || obj?.mediaId || index;
  },

  arrays: {
    // default true, detect items moved inside the array (otherwise they will be registered as remove+add)
    detectMove: true,
    // default false, the value of items moved is not included in deltas
    includeValueOnMove: true,
  },

  /** default false. if true, values in the obtained delta will be cloned
   * (using jsondiffpatch.clone by default), to ensure delta keeps no references to left or right objects.
   * this becomes useful if you're diffing and patching the same objects
   * multiple times without serializing deltas.
   * instead of true, a function can be specified here to provide a custom clone(value)
   */
  cloneDiffValues: false,
});

export default {
  diff(...args: Parameters<DiffPatcher['diff']>) {
    return patcher.diff(...args);
  },

  patch(...args: Parameters<DiffPatcher['patch']>) {
    return patcher.patch(...args);
  },
};
