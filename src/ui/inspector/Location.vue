/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

<template>
<div class="c-inspect-properties c-inspect-properties--location">
    <div
        class="c-inspect-properties__header"
        title="The location of this linked object."
    >
        Original Location
    </div>
    <ul
        v-if="!multiSelect"
        class="c-inspect-properties__section"
    >
        <li
            v-if="originalPath.length"
            class="c-inspect-properties__row"
        >
            <ul class="c-inspect-properties__value c-location">
                <li
                    v-for="pathObject in orderedOriginalPath"
                    :key="pathObject.key"
                    class="c-location__item"
                >
                    <object-label
                        :domain-object="pathObject.domainObject"
                        :object-path="pathObject.objectPath"
                    />
                </li>
            </ul>
        </li>
    </ul>
    <div
        v-if="multiSelect"
        class="c-inspect-properties__row--span-all"
    >
        No location to display for multiple items
    </div>
</div>
</template>

<script>
import ObjectLabel from '../components/ObjectLabel.vue';

export default {
    components: {
        ObjectLabel
    },
    inject: ['openmct'],
    data() {
        return {
            domainObject: {},
            multiSelect: false,
            originalPath: [],
            keyString: ''
        };
    },
    computed: {
        orderedOriginalPath() {
            return this.originalPath.slice().reverse();
        }
    },
    mounted() {
        this.openmct.selection.on('change', this.updateSelection);
        this.updateSelection(this.openmct.selection.get());
    },
    beforeDestroy() {
        this.openmct.selection.off('change', this.updateSelection);
    },
    methods: {
        setOriginalPath(path, skipSlice) {
            let originalPath = path;

            if (!skipSlice) {
                originalPath = path.slice(1, -1);
            }

            this.originalPath = originalPath.map((domainObject, index, pathArray) => {
                let key = this.openmct.objects.makeKeyString(domainObject.identifier);

                return {
                    domainObject,
                    key,
                    objectPath: pathArray.slice(index)
                };
            });
        },
        clearData() {
            this.domainObject = {};
            this.originalPath = [];
            this.keyString = '';
        },
        updateSelection(selection) {
            if (!selection.length || !selection[0].length) {
                this.clearData();

                return;
            }

            if (selection.length > 1) {
                this.multiSelect = true;

                return;
            } else {
                this.multiSelect = false;
            }

            this.domainObject = selection[0][0].context.item;
            let parentObject = selection[0][1];

            if (!this.domainObject && parentObject && parentObject.context.item) {
                this.setOriginalPath([parentObject.context.item], true);
                this.keyString = '';

                return;
            }

            let keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);

            if (keyString && this.keyString !== keyString) {
                this.keyString = keyString;
                this.originalPath = [];

                this.openmct.objects.getOriginalPath(this.keyString)
                    .then(this.setOriginalPath);
            }
        }
    }
};
</script>
