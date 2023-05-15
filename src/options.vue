<template>
    <div class="fields">
        <div class="field">
            <div class="type-label">Image Source</div>
            <v-select v-model="imageSourceWritable" show-deselect item-value="field" item-text="name" :items="fileFields" />
        </div>

        <div class="field">
            <div class="type-label">Title Field</div>
            <v-select v-model="titleWritable" show-deselect item-value="field" item-text="name" :items="fields" />
        </div>
    </div>
</template>

<script lang="ts">
import { useSync } from '@directus/extensions-sdk';

export default {
	inheritAttrs: false,
	props: {
		collection: {
			type: String,
			required: true,
		},
		fileFields: {
			type: Array,
			required: true,
		},
            fields: {
			type: Array,
			required: true,
		},
		imageSource: {
			type: String,
			default: null,
		},
		titleField: {
			type: String,
			default: null,
		},
	},
	emits: ['update:imageSource', 'update:titleField'],
	setup(props, { emit }) {

		const imageSourceWritable = useSync(props, 'imageSource', emit);
		const titleWritable = useSync(props, 'titleField', emit);

		return { imageSourceWritable, titleWritable };
	},
};
</script>

<style lang="scss" scoped>
.fields {
    grid-column: start/full;
}

.fields .field {
    margin-bottom: 24px;
}
</style>
