import './styles.scss';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Row, Col } from 'antd/lib/grid';
import Button from 'antd/lib/button';
import Empty from 'antd/lib/empty';
import Result from 'antd/lib/result';
import Text from 'antd/lib/typography/Text';
import Title from 'antd/lib/typography/Title';

import { getCore } from 'cvat-core-wrapper';
import GoBackButton from 'components/common/go-back-button';
import CVATLoadingSpinner from 'components/common/loading-spinner';
import LabelCountsChart, { LabelCount } from './label-counts-chart';

const core = getCore();

interface TaskLabelCounts {
    task_id: number;
    total: number;
    labels: LabelCount[];
}

function LabelCountsPage(): JSX.Element {
    const taskId = +useParams<{ tid: string }>().tid;

    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [counts, setCounts] = useState<TaskLabelCounts | null>(null);

    const loadCounts = useCallback(async (): Promise<void> => {
        setFetching(true);
        setError(null);
        try {
            const response = await core.server.request(
                `${core.config.backendAPI}/test/tasks/${taskId}/label-counts`,
                { method: 'GET' },
            );
            setCounts(response.data);
        } catch (requestError: unknown) {
            setError(requestError instanceof Error ? requestError : new Error('Unknown error'));
        } finally {
            setFetching(false);
        }
    }, [taskId]);

    useEffect(() => {
        loadCounts();
    }, [loadCounts]);

    let content: JSX.Element | null = null;
    if (fetching) {
        content = <CVATLoadingSpinner />;
    } else if (error) {
        content = (
            <Result
                className='cvat-label-counts-error'
                status='error'
                title='Could not load annotation counts'
                subTitle={error.message}
                extra={<Button type='primary' onClick={loadCounts}>Try again</Button>}
            />
        );
    } else if (counts && counts.total === 0) {
        content = (
            <Empty
                className='cvat-label-counts-empty'
                description='This task has no annotations yet'
            />
        );
    } else if (counts) {
        content = (
            <>
                <Text type='secondary' className='cvat-label-counts-total'>
                    {`${counts.total} annotations across ${counts.labels.length} labels`}
                </Text>
                <LabelCountsChart labels={counts.labels} />
            </>
        );
    }

    return (
        <div className='cvat-label-counts-page'>
            <Row justify='center'>
                <Col span={22} xl={18} xxl={14} className='cvat-task-top-bar'>
                    <GoBackButton />
                </Col>
            </Row>
            <Row justify='center'>
                <Col span={22} xl={18} xxl={14} className='cvat-label-counts-inner'>
                    <Title level={4} className='cvat-text-color'>
                        {`Annotation counts for task #${taskId}`}
                    </Title>
                    {content}
                </Col>
            </Row>
        </div>
    );
}

export default React.memo(LabelCountsPage);
