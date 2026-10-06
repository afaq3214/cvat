import React from 'react';
import {
    Chart as ChartJS, BarElement, CategoryScale, Legend, LinearScale, Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(BarElement, CategoryScale, Legend, LinearScale, Tooltip);

export interface LabelCount {
    id: number;
    name: string;
    color: string;
    count: number;
    by_type: Record<string, number>;
}

interface Props {
    labels: LabelCount[];
    groupByType: boolean;
}

const BAR_HEIGHT = 22;
const TYPE_COLORS = [
    '#1677ff', '#fa8c16', '#52c41a', '#eb2f96', '#13c2c2', '#722ed1', '#fadb14', '#8c8c8c', '#f5222d', '#2f54eb',
];

function LabelCountsChart(props: Readonly<Props>): JSX.Element {
    const { labels, groupByType } = props;

    let datasets = [{
        label: 'Annotations',
        data: labels.map((label) => label.count),
        backgroundColor: labels.map((label) => label.color) as string | string[],
    }];

    if (groupByType) {
        const types = Array.from(new Set(labels.flatMap((label) => Object.keys(label.by_type)))).sort();
        datasets = types.map((type, index) => ({
            label: type,
            data: labels.map((label) => label.by_type[type] ?? 0),
            backgroundColor: TYPE_COLORS[index % TYPE_COLORS.length],
        }));
    }

    const options = {
        indexAxis: 'y' as const,
        maintainAspectRatio: false,
        plugins: { legend: { display: groupByType } },
        scales: {
            x: { beginAtZero: true, stacked: groupByType, ticks: { precision: 0 } },
            y: { stacked: groupByType, ticks: { autoSkip: false } },
        },
    };

    return (
        <div className='cvat-label-counts-chart' style={{ height: labels.length * BAR_HEIGHT }}>
            <Bar data={{ labels: labels.map((label) => label.name), datasets }} options={options} />
        </div>
    );
}

export default React.memo(LabelCountsChart);
