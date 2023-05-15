import { useI18n } from 'vue-i18n';
import { computed, toRefs, unref } from 'vue';
import { useRouter } from 'vue-router';
import { useCollection, useItems, useSync, useStores } from '@directus/extensions-sdk';
import LayoutComponent from './layout.vue';
import LayoutOptions from './options.vue';

export default {
	id: 'timio23-custom-layout',
	name: 'Custom Layout',
	icon: 'box',
	component: LayoutComponent,
	slots: {
		options: LayoutOptions,
		sidebar: () => null,
		actions: () => null,
	},
	setup(props, { emit }) {
		const router = useRouter();
		const selection = useSync(props, 'selection', emit);
		const { collection, filter, search } = toRefs(props);
		const { info, primaryKeyField, fields: fieldsInCollection, sortField } = useCollection(collection);

		// Pagination and Sorting
		const layoutQuery = useSync(props, 'layoutQuery', emit);
		const { sort, limit, page, fields } = useItemOptions();

		const { items, loading, error, totalPages, itemCount, totalCount, changeManualSort, getItems, getItemCount, getTotalCount } = useItems(collection, {
			sort,
			limit,
			page,
			fields: '*',
			filter,
			search,
		});

		const showingCount = computed(() => {
			const filtering = Boolean((itemCount.value || 0) < (totalCount.value || 0) && filterUser.value);
			return formatCollectionItemsCount(itemCount.value || 0, page.value, limit.value, filtering);
		});

		// Layout Options
		const { useRelationsStore } = useStores();
		const relationsStore = useRelationsStore();
		const layoutOptions = useSync(props, 'layoutOptions', emit);
		const fileFields = computed(() => {
			return fieldsInCollection.value.filter((field) => {
				if (field.field === '$thumbnail') return true;

				const relation = relationsStore.relations.find((relation) => {
					return (
						relation.collection === props.collection &&
						relation.field === field.field &&
						relation.related_collection === 'directus_files'
					);
				});

				return !!relation;
			});
		});
		const { titleField, imageSource } = useLayoutOptions();

		return {
			info,
			items,
			loading,
			filter,
			search,
			error,
			
			// Pagination
			limit,
			page,
			toPage,
			totalPages,
			showingCount,
			itemCount,
			totalCount,
			
			// Selection
			  primaryKeyField,
			onRowClick,
			selectAll,
			
			// Sorting
			sort,
			sortField,
			onSortChange,
			changeManualSort,
			  fieldsInCollection,
		
			// Layout Options
			fields,
			fileFields,
			imageSource,
			titleField,
		};

		// Pagination and Sorting
		function toPage(newPage) {
			page.value = newPage;
		}
		
		function onSortChange(newSort) {
			if (!newSort?.by) {
				sort.value = [];
				return;
			}
		
			let sortString = newSort.by;
		
			if (newSort.desc === true) {
				sortString = '-' + sortString;
			}
		
			sort.value = [sortString];
		}
		
		function useItemOptions() {
			// Pagination
			const page = syncRefProperty(layoutQuery, 'page', 1);
			const limit = syncRefProperty(layoutQuery, 'limit', 25);
			// Sort
			const defaultSort = computed(() => (primaryKeyField.value ? [primaryKeyField.value?.field] : []));
			const sort = syncRefProperty(layoutQuery, 'sort', defaultSort);
		
			const fieldsDefaultValue = computed(() => {
				return fieldsInCollection.value
					.filter((field) => !field.meta?.hidden)
					.slice(0, 4)
					.map(({ field }) => field)
					.sort();
			});
		
			const fields = syncRefProperty(layoutQuery, 'fields', fieldsDefaultValue);
		
			return { sort, limit, page, fields };
		}
		
		function syncRefProperty(ref, key, defaultValue) {
			return computed({
				get() {
					return ref.value?.[key] ?? unref(defaultValue);
				},
				set(value) {
					ref.value = Object.assign({}, ref.value, { [key]: value });
				},
			});
		}
		
		function formatCollectionItemsCount(
			totalItems,
			currentPage,
			perPage,
			isFiltered = false
		) {
			const { t, n } = useI18n();
		
			const opts = {
				start: n((+currentPage - 1) * perPage + 1),
				end: n(Math.min(currentPage * perPage, totalItems || 0)),
				count: n(totalItems || 0),
			};
		
			if (isFiltered) {
				if (totalItems === 1) {
					return t('one_filtered_item');
				}
		
				return t('start_end_of_count_filtered_items', opts);
			}
		
			if (totalItems > perPage) {
				return t('start_end_of_count_items', opts);
			}
		
			return t('item_count', { count: totalItems });
		}

		// Selection and Routing
		function selectAll() {
			if (!primaryKeyField.value) return;
			const pk = primaryKeyField.value;
			selection.value = items.value.map((item) => item[pk.field]);
		}
		
		function onRowClick({ item, event }) {
			if (props.readonly === true || !primaryKeyField.value) return;
		
			const primaryKey = item[primaryKeyField.value.field];
		
			if (props.selectMode || selection.value?.length > 0) {
				if (selection.value?.includes(primaryKey) === false) {
					selection.value = selection.value.concat(primaryKey);
				} else {
					selection.value = selection.value.filter((item) => item !== primaryKey);
				}
			} else {
				const next = router.resolve(`/content/${collection.value}/${encodeURIComponent(primaryKey)}`);
		
				if (event.ctrlKey || event.metaKey) window.open(next.href, '_blank');
				else router.push(next);
			}
		}

		// Layout Options
		function useLayoutOptions() {
			const imageSource = createViewOption('imageSource', fileFields.value[0]?.field ?? null);
			const titleField = createViewOption('titleField', 'title');
		
			return { imageSource, titleField };
		
			function createViewOption(key, defaultValue) {
				return computed({
					get() {
						return layoutOptions.value?.[key] !== undefined ? layoutOptions.value?.[key] : defaultValue;
					},
					set(newValue) {
						layoutOptions.value = {
							...layoutOptions.value,
							[key]: newValue,
						};
					},
				});
			}
		}
	},
};
