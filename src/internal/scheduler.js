import { run_all } from './utils.js';

export let dirty_components = [];
export const intros = { enabled: false };

let update_scheduled = false;
const binding_callbacks = [];
const render_callbacks = [];

export function schedule_update() {
	if (!update_scheduled) {
		update_scheduled = true;
		queue_microtask(flush);
	}
}

export function add_render_callback(fn) {
	render_callbacks.push(fn);
}

export function nextTick(fn) {
	add_render_callback(fn);
	schedule_update();
}

export function add_binding_callback(fn) {
	binding_callbacks.push(fn);
}

export function flush() {
	const seen_callbacks = new Set();

	do {
		// first, call beforeUpdate functions
		// and update components
		while (dirty_components.length) {
			update(dirty_components.shift().$$);
		}

		while (binding_callbacks.length) binding_callbacks.shift()();

		// then, once components are updated, call
		// afterUpdate functions. This may cause
		// subsequent updates...
		while (render_callbacks.length) {
			const callback = render_callbacks.pop();
			if (!seen_callbacks.has(callback)) {
				callback();

				// ...so guard against infinite loops
				seen_callbacks.add(callback);
			}
		}
	} while (dirty_components.length);

	update_scheduled = false;
}

function update($$) {
	if ($$.fragment) {
		$$.update($$.dirty);
		run_all($$.before_render);
		$$.fragment.p($$.dirty, $$.ctx);
		$$.dirty = null;

		$$.after_render.forEach(add_render_callback);
	}
}

function queue_microtask(callback) {
	Promise.resolve().then(() => {
		if (update_scheduled) callback();
	});
}