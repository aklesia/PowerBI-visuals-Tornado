/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

module powerbi.extensibility.visual.tooltipBuilder {
    // powerbi.extensibility.utils.formatting
    import valueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;

    const DefaultDisplayName: string = "";
    const DisplayNameDelimiter: string = "/";
    const HighlightedValueDisplayName: string = "Highlighted";
    const DefaultSeriesIndex: number = 0;

    export interface TooltipCategoryDataItem {
        value?: any;
        metadata: DataViewMetadataColumn[];
    }

    export interface TooltipSeriesDataItem {
        value?: any;
        highlightedValue?: any;
        metadata: DataViewValueColumn;
    }

    export function createTooltipInfo(
        dataViewCat: DataViewCategorical,
        categoryValue: any,
        value?: any,
        seriesIndex?: number,
        categoryIndex?: number,
        highlightedValue?: any): VisualTooltipDataItem[] {

        let categorySource: TooltipCategoryDataItem,
            seriesSource: TooltipSeriesDataItem[] = [],
            valuesSource: DataViewMetadataColumn = undefined;

        seriesIndex = seriesIndex | DefaultSeriesIndex;

        let categoriesData: DataViewCategoricalColumn[] = dataViewCat && dataViewCat.categories;

        if (categoriesData && categoriesData.length > 0) {
            if (categoriesData.length > 1) {
                let compositeCategoriesData: DataViewMetadataColumn[] = [];

                for (let i: number = 0, ilen: number = categoriesData.length; i < ilen; i++) {
                    compositeCategoriesData.push(categoriesData[i].source);
                }

                categorySource = {
                    value: categoryValue,
                    metadata: compositeCategoriesData
                };
            }
            else {
                categorySource = {
                    value: categoryValue,
                    metadata: [categoriesData[0].source]
                };
            }
        }
        if (dataViewCat && dataViewCat.values) {
            if (!categorySource || !(categorySource.metadata[0] === dataViewCat.values.source)) {
                valuesSource = dataViewCat.values.source;
            }

            if (dataViewCat.values.length > 0) {
                let valueColumn: DataViewValueColumn = dataViewCat.values[seriesIndex],
                    isAutoGeneratedColumn: boolean = !!(valueColumn
                        && valueColumn.source
                        && (<any>valueColumn.source).isAutoGeneratedColumn);

                if (!isAutoGeneratedColumn) {
                    seriesSource.push({
                        value,
                        highlightedValue,
                        metadata: valueColumn
                    });
                }
            }
        }

        return createTooltipData(
            categorySource,
            valuesSource,
            seriesSource);
    }

    export function createTooltipData(
        categoryValue: TooltipCategoryDataItem,
        valuesSource: DataViewMetadataColumn,
        seriesValues: TooltipSeriesDataItem[]): VisualTooltipDataItem[] {

        let items: VisualTooltipDataItem[] = [];

        if (categoryValue) {
            if (categoryValue.metadata.length > 1) {
                let displayName: string = DefaultDisplayName;

                for (let i: number = 0, ilen: number = categoryValue.metadata.length; i < ilen; i++) {
                    if (i !== 0) {
                        displayName += DisplayNameDelimiter;
                    }

                    displayName += categoryValue.metadata[i].displayName;
                }

                let categoryFormattedValue: string = getFormattedValue(
                    categoryValue.metadata[0],
                    categoryValue.value);

                items.push({
                    displayName,
                    value: categoryFormattedValue
                });
            }
            else {
                let categoryFormattedValue: string = getFormattedValue(
                    categoryValue.metadata[0],
                    categoryValue.value);

                items.push({
                    displayName: categoryValue.metadata[0].displayName,
                    value: categoryFormattedValue
                });
            }
        }

        if (valuesSource) {
            // Dynamic series value
            let dynamicValue: string;

            if (seriesValues.length > 0) {
                let dynamicValueMetadata: DataViewMetadataColumn = seriesValues[0].metadata.source;

                dynamicValue = getFormattedValue(
                    valuesSource,
                    dynamicValueMetadata.groupName);
            }

            items.push({
                displayName: valuesSource.displayName,
                value: dynamicValue
            });
        }

        for (let i: number = 0; i < seriesValues.length; i++) {
            let seriesData = seriesValues[i];

            if (seriesData && seriesData.metadata) {
                let seriesMetadataColumn: DataViewMetadataColumn = seriesData.metadata.source,
                    value: any = seriesData.value,
                    highlightedValue: any = seriesData.highlightedValue;

                if (value || value === 0) {
                    let formattedValue: string = getFormattedValue(
                        seriesMetadataColumn,
                        value);

                    items.push({
                        displayName: seriesMetadataColumn.displayName,
                        value: formattedValue
                    });
                }

                if (highlightedValue || highlightedValue === 0) {
                    let formattedHighlightedValue: string = getFormattedValue(
                        seriesMetadataColumn,
                        highlightedValue);

                    items.push({
                        displayName: HighlightedValueDisplayName,
                        value: formattedHighlightedValue
                    });
                }
            }
        }

        return items;
    }

    export function getFormattedValue(column: DataViewMetadataColumn, value: any) {
        let formatString: string = getFormatStringFromColumn(column);

        return valueFormatter.format(value, formatString);
    }

    export function getFormatStringFromColumn(column: DataViewMetadataColumn): string {
        if (column) {
            let formatString: string = valueFormatter.getFormatStringByColumn(column, true);

            return formatString || column.format;
        }

        return null;
    }
}
