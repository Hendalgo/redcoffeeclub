const game = document.querySelector<HTMLElement>('[data-coffee-game]');

if (game) {
  const beans = Array.from(game.querySelectorAll<HTMLButtonElement>('[data-game-bean]'));
  const cup = game.querySelector<HTMLElement>('[data-game-cup]')!;
  const count = game.querySelector<HTMLElement>('[data-game-count]')!;
  const progress = game.querySelector<HTMLElement>('[data-game-progress]')!;
  const dots = Array.from(game.querySelectorAll<HTMLElement>('.rescue-dots i'));
  const status = game.querySelector<HTMLElement>('[data-game-status]')!;
  const reset = game.querySelector<HTMLButtonElement>('[data-game-reset]')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const flights = new Set<Animation>();
  let collected = 0;

  function render() {
    const complete = collected === beans.length;
    count.textContent = String(collected).padStart(2, '0');
    progress.setAttribute('aria-valuenow', String(collected));
    cup.style.setProperty('--brew', String(collected / beans.length));
    cup.setAttribute('aria-label', complete ? 'Taza de café lista' : `Taza con ${collected} de ${beans.length} granos`);
    dots.forEach((dot, index) => dot.toggleAttribute('data-filled', index < collected));
    game!.toggleAttribute('data-complete', complete);
    reset.disabled = collected === 0;
    reset.firstChild!.textContent = complete ? 'Otra taza ' : 'Reiniciar ';
    status.textContent = complete ? 'Tu café está listo. Ahora sí, volvamos a la RED.'
      : collected ? `${collected} de ${beans.length} granos. Ya huele a café.` : 'Sin prisa. El café se disfruta.';
  }

  function finishFlights() {
    flights.forEach(flight => flight.finish());
  }

  beans.forEach(bean => {
    bean.disabled = false;
    bean.addEventListener('click', event => {
      if (bean.disabled) return;
      bean.disabled = true;
      collected += 1;
      render();
      // Keep keyboard play continuous as each collected button leaves the board.
      if (event.detail === 0) (beans.find(next => !next.disabled) ?? reset).focus({ preventScroll: true });
      if (reduced.matches || typeof bean.animate !== 'function') { bean.hidden = true; return; }

      const from = bean.getBoundingClientRect();
      const to = cup.getBoundingClientRect();
      const dx = to.x + to.width / 2 - from.x - from.width / 2;
      const dy = to.y + to.height / 2 - from.y - from.height / 2;
      const art = bean.querySelector<HTMLElement>('.bean-flight')!;
      const flight = art.animate([
        { transform: 'translate(0, 0) rotate(0deg) scale(1)', opacity: 1 },
        { transform: `translate(${dx * .4}px, ${dy * .4 - 40}px) rotate(45deg) scale(.85)`, opacity: 1, offset: .4 },
        { transform: `translate(${dx}px, ${dy}px) rotate(110deg) scale(.12)`, opacity: 0 },
      ], { duration: 650, easing: 'cubic-bezier(.32,.72,0,1)', fill: 'forwards' });
      flights.add(flight);
      flight.finished.then(() => { bean.hidden = true; flights.delete(flight); flight.cancel(); }).catch(() => {});
    });
  });

  reset.addEventListener('click', event => {
    flights.forEach(flight => flight.cancel());
    flights.clear();
    collected = 0;
    beans.forEach(bean => { bean.disabled = false; bean.hidden = false; });
    render();
    if (event.detail === 0) beans[0].focus({ preventScroll: true });
  });
  // Settle active flights when motion is reduced or the tab is put away.
  reduced.addEventListener('change', () => { if (reduced.matches) finishFlights(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) finishFlights(); });
}
