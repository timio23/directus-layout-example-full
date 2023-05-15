<template>
	<div v-if="!loading">
		<div class="header">
			<div class="start">
				<div v-if="selectionWritable.length > 0" class="selected" @click="selectionWritable = []">
					<v-icon name="cancel" outline />
					<span class="label">{{ t('n_items_selected', selectionWritable.length) }}</span>
				</div>
				<button v-else class="select-all" @click="selectAll()">
					<v-icon name="check_circle" outline />
					<span class="label">{{ t('select_all') }}</span>
				</button>
				<transition name="fade">
						<span v-if="itemCount" class="item-count">
							{{ showingCount }}
						</span>
					</transition>

			</div>
			<div class="end">
				<div class="sort">
					<label>Sort:</label>
					<v-menu show-arrow placement="bottom">
						<template #activator="{ toggle }">
							<div v-tooltip.top="t('sort_field')" class="sort-selector" @click="toggle">
								{{ sortField && sortField.name }}
							</div>
						</template>

						<v-list>
							<v-list-item
								v-for="field in fieldsWithoutFake"
								:key="field.field"
								:disabled="field.disabled"
								:active="field.field === sortKey"
								clickable
								@click="sortSync = [field.field]"
							>
								<v-list-item-content>{{ field.name }}</v-list-item-content>
							</v-list-item>
						</v-list>
					</v-menu>
					<v-icon
						v-tooltip.top="t('sort_direction')"
						class="sort-direction"
						:class="{ descending }"
						name="sort"
						clickable
						@click="toggleDescending"
					/>
				</div>
			</div>
		</div>

		<table>
			<thead>
				<tr>
					<th>&nbsp;</th>
					<th>Name</th>
					<th>Email</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="item in items" :key="item.id" @click="onRowClick({item: item, event: $event})">
					<td>
						<v-icon class="selector" :name="selectionIcon(item[primaryKeyField.field])" @click.stop="toggleSelection(item[primaryKeyField.field])" />
					</td>
					<td>{{ item.name }}</td>
					<td>{{ item.email }}</td>
				</tr>
			</tbody>
		</table>

		<div class="footer">
			<div class="pagination">
				<v-pagination
					v-if="totalPages > 1"
					:length="totalPages"
					:total-visible="7"
					show-first-last
					:model-value="page"
					@update:model-value="toPage"
				/>
			</div>

			<div class="view-settings">
				<div v-if="loading === false && items != undefined && items.length >= 25" class="per-page">
					<span>{{ t('per_page') }}</span>
					<v-select
						:model-value="`${limit}`"
						:items="['25', '50', '100', '250', '500', ' 1000']"
						inline
						@update:model-value="limitWritable = +$event"
					/>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { useI18n } from 'vue-i18n';
import { watch, computed } from 'vue';
import { useSync } from '@directus/extensions-sdk';

export default {
	inheritAttrs: false,
	props: {
		collection: {
			type: String,
			required: true,
		},
		items: Array,
		loading: Boolean,
		error: Array,
		search: {
			type: String,
			default: null,
		},

		// Pagination
		totalPages: Number,
		page: Number,
		limit: Number,
		toPage: (newPage) => null,
		itemCount: Number,

		// Sorting
		primaryKeyField: String,
		sort: {
			type: Array,
			required: true,
		},
		sortField: {
			type: Array,
			default: null,
		},
		fieldsInCollection: {
			type: Array,
			required: true,
		},
		onSortChange: () => null,

		// Selection
		selectAll: () => null,
		onRowClick: () => null,
		selectMode: Boolean,
		selection: {
			type: Array,
			default: () => [],
		},

		// Layout Options
		fields: {
			type: Array,
			required: true,
		},
		layoutOptions: Array,
		imageSource: {
			type: String,
			default: null,
		},
		titleField: {
			type: String,
			default: null,
		},
	},
	emits: ['update:selection','update:limit','update:fields','update:sort'],
	setup(props, { emit }) {
		const { t } = useI18n();

		// Sorting
		const sortSync = useSync(props, 'sort', emit);
		const descending = computed(() => props.sort[0].startsWith('-'));
		const sortKey = computed(() => (props.sort[0].startsWith('-') ? props.sort[0].substring(1) : props.sort[0]));
		const sortField = computed(() => {
			return props.fieldsInCollection.find((field) => field.field === sortKey.value);
		});
		const fieldsWithoutFake = computed(() => {
			return props.fieldsInCollection
				.filter((field) => field.field.startsWith('$') === false)
				.map((field) => ({
					field: field.field,
					name: field.name,
					disabled: ['json', 'o2m', 'm2o', 'm2a', 'file', 'files', 'alias', 'presentation'].includes(field.type),
				}));
		});
		function toggleDescending() {
			if (descending.value === true) {
				sortSync.value = [sortSync.value[0].substring(1)];
			} else {
				sortSync.value = ['-' + sortSync.value];
			}
		}

		// Selection
		const selectionWritable = useSync(props, 'selection', emit);
		function selectionIcon(item_id) {
			if (!item_id) return 'check_box_outline_blank';
			return selectionWritable.value.includes(item_id) ? 'check_box' : 'check_box_outline_blank';
		}

		function isSelected(item_id) {
			if (!item_id) return false;
			return selectionWritable.value.includes(item_id);
		}

		function toggleSelection(item_id) {
			if (!item_id) return null;
			if (selectionWritable.value?.includes(item_id) === false) {
				selectionWritable.value = selectionWritable.value.concat(item_id);
			} else {
				selectionWritable.value = selectionWritable.value.filter((item) => item !== item_id);
			}
		}

		// Pagination
		const limitWritable = useSync(props, 'limit', emit);
		watch(
			() => props.page,
		);

		return {
			// Existing items here
			t,

			// Sort
			descending,
			toggleDescending,
			sortField,
			sortSync,
			sortKey,
			fieldsWithoutFake,

			// Selection
			selectionWritable,
			toggleSelection,
			selectionIcon,
			isSelected,

			// Pagination
			limitWritable,

		};
	}
};
</script>
<style lang="scss">
	.header {
		position: sticky;
		top: var(--layout-offset-top);
		z-index: 4;
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		height: 52px;
		margin-bottom: 36px;
		padding: 0 var(--content-padding);
		background-color: var(--background-page);
		border-top: var(--border-width) solid var(--border-subdued);
		border-bottom: var(--border-width) solid var(--border-subdued);
		box-shadow: 0 0 0 2px var(--background-page);

		.start {
			.label {
				display: inline-block;
				margin-left: 4px;
				transform: translateY(1px);
			}

			.select-all {
				color: var(--foreground-subdued);
				transition: color var(--fast) var(--transition);

				&:hover {
					color: var(--foreground-normal);
				}
			}

			.selected {
				cursor: pointer;
			}
		}

		.end {
			display: flex;
			align-items: center;
			color: var(--foreground-subdued);
		}
		.sort {
			display: flex;
			align-items: center;
			justify-content: flex-end;
			color: var(--foreground-subdued);

			span, label {
				width: auto;
				margin-right: 6px;
			}

			.v-select, .v-icon {
				color: var(--foreground-normal);
			}
		}

		.sort-selector {
			margin-right: 8px;
			transition: color var(--fast) var(--transition);

			&:hover {
				color: var(--foreground-normal);
				cursor: pointer;
			}
		}

		.sort-direction {
			transition: color var(--fast) var(--transition);

			&.descending {
				transform: scaleY(-1);
			}

			&:hover {
				color: var(--foreground-normal);
				cursor: pointer;
			}
		}
	}

	.footer {
		position: sticky;
		left: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 32px var(--content-padding);

		.view-settings {
			display: flex;
			align-items: center;
			justify-content: flex-end;
			width: 320px;
			color: var(--foreground-subdued);
		}

		.per-page {
			display: flex;
			align-items: center;
			justify-content: flex-end;
			color: var(--foreground-subdued);

			span, label {
				width: auto;
				margin-right: 6px;
			}

			.v-select, .v-icon {
				color: var(--foreground-normal);
			}
		}
	}
</style>
