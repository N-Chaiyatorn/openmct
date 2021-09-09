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

import TelemetryTable from '../telemetryTable/TelemetryTable.js';
import TelemetryTableRow from '../telemetryTable/TelemetryTableRow.js';

export default class LADTable extends TelemetryTable {
    constructor(domainObject, openmct) {
        super(domainObject, openmct);
        this.domainObject = domainObject;
        this.openmct = openmct;
    }
    initialize() {
        this.tableRows.addRows = this.addRows;
        if (this.domainObject.type === 'new.ladTable' || this.domainObject.type === 'new.LadTableSet') {
            // this.filterObserver = this.openmct.objects.observe(this.domainObject, 'configuration.filters', this.updateFilters);
            // this.filters = this.domainObject.configuration.filters;
            this.loadComposition();
        } else {
            this.addTelemetryObject(this.domainObject);
        }
    }
    addTelemetryObject(telemetryObject) {
        this.addColumnsForObject(telemetryObject, true);

        const keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
        let requestOptions = this.buildOptionsFromConfiguration(telemetryObject);
        requestOptions.strategy = 'latest';
        requestOptions.size = 1;
        let columnMap = this.getColumnMapForObject(keyString);
        let limitEvaluator = this.openmct.telemetry.limitEvaluator(telemetryObject);

        this.incrementOutstandingRequests();

        const telemetryProcessor = this.getTelemetryProcessor(keyString, columnMap, limitEvaluator);
        const telemetryRemover = this.getTelemetryRemover();

        this.removeTelemetryCollection(keyString);
        this.telemetryCollections[keyString] = this.openmct.telemetry
            .requestCollection(telemetryObject, requestOptions);
        this.telemetryCollections[keyString].on('remove', telemetryRemover);
        this.telemetryCollections[keyString].on('add', telemetryProcessor);
        this.telemetryCollections[keyString].load();

        this.decrementOutstandingRequests();

        this.telemetryObjects[keyString] = {
            telemetryObject,
            keyString,
            requestOptions,
            columnMap,
            limitEvaluator
        };

        this.emit('object-added', telemetryObject);
    }
    addRows(rows, type = 'add') {
        if (this.sortOptions === undefined) {
            throw 'Please specify sort options';
        }

        let isFilterTriggeredReset = type === 'filter';
        let anyActiveFilters = Object.keys(this.columnFilters).length > 0;
        let rowsToAdd = !anyActiveFilters ? rows : rows.filter(this.matchesFilters, this);

        // if type is filter, then it's a reset of all rows,
        // need to wipe current rows
        if (isFilterTriggeredReset) {
            this.rows = [];
        }

        // remove old rows of the object before adding
        // there's only 1 row so keystring will be the same
        const keyString = rows[0].objectKeyString;
        this.removeRowsByObject(keyString);

        for (let row of rowsToAdd) {
            let index = this.sortedIndex(this.rows, row);
            this.rows.splice(index, 0, row);
        }

        // we emit filter no matter what to trigger
        // an update of visible rows
        if (rowsToAdd.length > 0 || isFilterTriggeredReset) {
            this.emit(type, rowsToAdd);
        }
    }
    getTelemetryProcessor(keyString, columnMap, limitEvaluator) {
        return (telemetry) => {
            //Check that telemetry object has not been removed since telemetry was requested.
            if (!this.telemetryObjects[keyString]) {
                return;
            }

            // only add the latest telemetry
            let latest = telemetry[telemetry.length - 1];
            let telemetryRow = [new TelemetryTableRow(latest, columnMap, keyString, limitEvaluator)];
            if (this.paused) {
                this.delayedActions.push(this.tableRows.addRows.bind(this, telemetryRow, 'add'));
            } else {
                this.tableRows.addRows(telemetryRow, 'add');
            }
        };
    }
}
