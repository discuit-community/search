function updateItemRadii(container: HTMLElement) {
	const items = container.querySelectorAll<HTMLElement>(".result");
	const containerRect = container.getBoundingClientRect();

	const maxDistance = 128;
	const minRadius = 0.5;
	const maxRadius = 2.7;

	for (const item of items) {
		const itemRect = item.getBoundingClientRect();

		const distanceTop = itemRect.top - containerRect.top;
		const distanceBottom = containerRect.bottom - itemRect.bottom;

		let topRadius = minRadius;
		if (distanceTop >= 0 && distanceTop <= maxDistance) {
			topRadius =
				maxRadius - (maxRadius - minRadius) * (distanceTop / maxDistance);
		} else if (distanceTop < 0) {
			topRadius = maxRadius;
		}

		let bottomRadius = minRadius;
		if (distanceBottom >= 0 && distanceBottom <= maxDistance) {
			bottomRadius =
				maxRadius - (maxRadius - minRadius) * (distanceBottom / maxDistance);
		} else if (distanceBottom < 0) {
			bottomRadius = maxRadius;
		}

		item.style.setProperty("--item-top-radius", `${topRadius}rem`);
		item.style.setProperty("--item-bottom-radius", `${bottomRadius}rem`);
	}
}

export default {
	mounted(el: HTMLElement) {
		const update = () => updateItemRadii(el);
		el.__dynamicRadiusUpdate__ = update;

		el.addEventListener("scroll", update);
		window.addEventListener("resize", update);

		const observer = new MutationObserver(() => setTimeout(update, 10));
		observer.observe(el, { childList: true, subtree: true });
		el.__dynamicRadiusObserver__ = observer;

		setTimeout(update, 50);
	},
	unmounted(el: HTMLElement) {
		const update = el.__dynamicRadiusUpdate__;
		if (update) {
			el.removeEventListener("scroll", update);
			window.removeEventListener("resize", update);
		}
		el.__dynamicRadiusObserver__?.disconnect();

		el.__dynamicRadiusUpdate__ = undefined;
		el.__dynamicRadiusObserver__ = undefined;
	},
};
