<template>
  <main class="screenshot-page">
    <section class="playspace-board" aria-label="Temporary playspace grid screenshot">
      <div class="playspace-layout" aria-hidden="true">
        <div class="zone-row zone-row--edge">
          <div class="zone-space zone-space--edge" />
          <div class="zone-space zone-space--edge" />
          <div class="zone zone--red" />
          <div class="zone zone--red" />
          <div class="zone zone--red" />
          <div class="zone-space zone-space--edge" />
          <div class="zone-space zone-space--edge" />
        </div>

        <div class="zone-row">
          <div class="zone zone--blue" />
          <div class="zone zone--blue" />
          <div class="zone zone--brown" />
          <div class="zone zone--brown" />
          <div class="zone zone--brown" />
          <div class="zone-space" />
          <div class="zone-space" />
        </div>

        <div class="zone-row">
          <div class="zone zone--blue" />
          <div class="zone zone--blue" />
          <div class="zone zone--brown" />
          <div class="zone zone--brown" />
          <div class="zone zone--brown" />
          <div class="zone-space" />
          <div class="zone-space" />
        </div>

        <div class="zone-row">
          <div class="zone-space" />
          <div class="zone-space" />
          <div class="zone zone--brown" />
          <div class="zone zone--brown" />
          <div class="zone zone--brown" />
          <div class="zone zone--blue" />
          <div class="zone zone--blue" />
        </div>

        <div class="zone-row">
          <div class="zone-space" />
          <div class="zone-space" />
          <div class="zone zone--brown" />
          <div class="zone zone--brown" />
          <div class="zone zone--brown" />
          <div class="zone zone--blue" />
          <div class="zone zone--blue" />
        </div>

        <div class="zone-row zone-row--edge">
          <div class="zone-space zone-space--edge" />
          <div class="zone-space zone-space--edge" />
          <div class="zone zone--red" />
          <div class="zone zone--red" />
          <div class="zone zone--red" />
          <div class="zone-space zone-space--edge" />
          <div class="zone-space zone-space--edge" />
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.screenshot-page {
  height: 100dvh;
  min-height: 0;
  display: grid;
  place-items: center;
  margin: 0;
  background: #050505;
  overflow: hidden;
}

.playspace-board {
  position: relative;
  width: min(100vw, 150dvh);
  max-height: 100dvh;
  aspect-ratio: 3 / 2;
  container-type: size;
  background-color: white;
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}

.playspace-layout {
  position: absolute;
  top: 50%;
  left: 50%;
  --row-gap: clamp(4px, 0.55cqh, 8px);
  --column-gap: clamp(14px, 2cqw, 34px);
  --unit-size: calc((92cqh - (var(--row-gap) * 5)) * 3 / 16);
  --card-width: calc(var(--unit-size) * 2 / 3);
  --red-height: calc(var(--unit-size) * 2 / 3);
  display: flex;
  flex-direction: column;
  gap: var(--row-gap);
  transform: translate(-50%, -50%);
}

.zone-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--column-gap);
  height: var(--unit-size);
}

.zone-row--edge {
  height: var(--red-height);
}

.zone {
  border: 2px solid rgba(255, 255, 255, 0.75);
  box-shadow:
    inset 0 0 0 1px rgba(0, 0, 0, 0.35),
    0 3px 10px rgba(0, 0, 0, 0.25);
}

.zone--red {
  width: var(--unit-size);
  height: var(--red-height);
  aspect-ratio: 3 / 2;
  background: rgba(214, 34, 34, 0.74);
}

.zone--blue {
  width: var(--card-width);
  height: var(--unit-size);
  aspect-ratio: 2 / 3;
  background: rgba(34, 93, 216, 0.74);
}

.zone--brown {
  width: var(--unit-size);
  height: var(--unit-size);
  background: rgba(128, 78, 37, 0.78);
}

.zone-space {
  width: var(--card-width);
  height: var(--unit-size);
}

.zone-space--edge {
  height: var(--red-height);
}
</style>
