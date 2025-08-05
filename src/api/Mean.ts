export class Mean {
  samples = 0;
  mean = 0;
  min = Infinity;
  max = -Infinity;
  sosd = 0; // sum of squared deltas

  reset() {
    this.samples = 0;
    this.mean = 0;
    this.min = Infinity;
    this.max = -Infinity;
    this.sosd = 0;

    return this;
  }

  add(value: number) {
    ++this.samples;

    this.min = Math.min(this.min, value);
    this.max = Math.max(this.max, value);

    const delta = value - this.mean;
    this.mean += delta / this.samples;
    this.sosd += delta * (value - this.mean);

    return this;
  }

  sampleVariance() {
    return (this.samples > 1) ? this.sosd / (this.samples - 1) : 0;
  }

  sampleStdDev() {
    return (this.samples > 1) ? Math.sqrt(this.sampleVariance()) : 0;
  }

  populationVariance() {
    return (this.samples > 0) ? this.sosd / this.samples : 0;
  }

  populationStdDev() {
    return (this.samples > 0) ? Math.sqrt(this.populationVariance()) : 0;
  }

  stdError() {
    return (this.samples > 1)
      ? this.sampleStdDev() / Math.sqrt(this.samples)
      : 0;
  }
}
