import React from 'react';
import {
    Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

export interface LabelCount {
    id: number;
    name: string;
    color: string;
    count: number;
}

interface Props {
    labels: LabelCount[];
}

const BAR_HEIGHT = 22;

function LabelCountsChart(props: Readonly<Props>): JSX.Element {
    const { labels } = props;

    const data = {
        labels: labels.map((label) => label.name),
        datasets: [{
            label: 'Annotations',
            data: labels.map((label) => label.count),
            backgroundColor: labels.map((label) => label.color),
        }],
    };

    const options = {
        indexAxis: 'y' as const,
        maintainAspectRatio: false,
        scales: {
            x: { beginAtZero: true, ticks: { precision: 0 } },
            y: { ticks: { autoSkip: false } },
        },
    };

    return (
        <div className='cvat-label-counts-chart' style={{ height: labels.length * BAR_HEIGHT }}>
            <Bar data={data} options={options} />
        </div>
    );
}

export default React.memo(LabelCountsChart);
