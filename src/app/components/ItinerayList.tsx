"use client";

import { Avatar, List, Skeleton, Typography, Modal, Input, Card, Button, Flex, Alert, Collapse, Tooltip, Timeline } from 'antd';
import React, { useState, useEffect } from 'react';
import { findFlagUrlByCountryName } from 'country-flags-svg';
import styled from 'styled-components';
import './style.scss';
import jsPDF from "jspdf";
// Remove all Leaflet imports
import Meta from "antd/es/card/Meta";
import ReactAnimatedWeather from 'react-animated-weather';
import { defaults } from './constants';
import html2canvas from 'html2canvas';
import dynamic from 'next/dynamic';

// Styled components
const ItineraryContainer = styled.div`
  background-color: #f4f4f9;
  border-radius: 10px;
  padding: 24px;
  margin: 24px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
`;

const ItineraryTitle = styled.h1`
  color: #333;
  font-size: 24px;
  text-align: center;
`;

const ItineraryDates = styled.h2`
  color: #555;
  font-size: 18px;
  text-align: center;
  margin-bottom: 10px;
`;

// Placeholder for the original MapView component

interface DayWisePlanListProps {
  dayWisePlan: string;
}
// Function to generate a random SVG path
const getRandomSvgPath = (svgPath: string) => {
  const randomNumber = Math.floor(Math.random() * 10) + 1; // Random number between 1 and 10
  return `/${svgPath}${randomNumber}.svg`;
};
const DayWisePlanList = ({ dayWisePlan }: DayWisePlanListProps) => {

  const [initLoading, setInitLoading] = useState(true);
  const [plans, setPlans] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentEditing, setCurrentEditing] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (dayWisePlan) {
      const initialPlans = dayWisePlan
        .split(';')
        .map(plan => plan.trim())
        .filter(plan => plan.length > 0);
      setPlans(initialPlans);
      setInitLoading(false);
    }
  }, [dayWisePlan]);

  // Disable initial loading state after data is processed
  React.useEffect(() => {
    if (plans.length > 0) {
      setInitLoading(false);
    }
  }, [plans]);

  const handleDelete = (index: number) => {
    const newPlans = [...plans];
    newPlans.splice(index, 1);
    setPlans(newPlans);
  };

  const showEditModal = (index: number) => {
    setCurrentEditing(index);
    setEditText(plans[index].split(': ')[1]); // Assuming the format "Day 1: Activity"
    setIsModalVisible(true);
  };

  const handleEdit = () => {
    if (currentEditing !== null) {
      const newPlans = [...plans];
      const parts = newPlans[currentEditing].split(': ');
      newPlans[currentEditing] = parts[0] + ': ' + editText;
      setPlans(newPlans);
    }
    setIsModalVisible(false);
    setCurrentEditing(null);
  };

  const renderItem = (plan: string, index: number) => (
    <List.Item
      actions={[
        <a key="list-loadmore-edit" onClick={() => showEditModal(index)}>Edit</a>,
        <a key="list-loadmore-delete" onClick={() => handleDelete(index)}>Delete</a>
      ]}>
      <Skeleton title={false} loading={initLoading} active>
        <List.Item.Meta
          avatar={<Avatar src={getRandomSvgPath('randomSvg')} />}
          title={plan.split(': ')[0]}
          description={plan.split(': ')[1]}
        />
      </Skeleton>
    </List.Item>
  );

  // Return the List component populated with rendered items
  return (
    <>
      <List
        loading={initLoading}
        itemLayout="horizontal"
        dataSource={plans}
        renderItem={(item, index) => renderItem(item, index)}
      />
      <Modal title="Edit Plan" open={isModalVisible} onOk={handleEdit} onCancel={() => setIsModalVisible(false)}>
        <Input value={editText} onChange={(e) => setEditText(e.target.value)} />
      </Modal>
    </>
  );
};
interface tipProps {
  dayWisePlan: string;
}
function convertStringToList(tips: string) {
  // Split the string at each period, filter out any empty strings, and trim whitespace from each entry
  return tips.split('.').filter(tip => tip.trim().length > 0).map(tip => tip.trim() + '.');
}
const tipsWarnings = (tips: string) => {
  const tip = convertStringToList(tips)
  return (<List
    bordered
    dataSource={tip}
    renderItem={(item) => (
      <List.Item>
        <Typography.Text mark></Typography.Text> {item}
      </List.Item>
    )}
  />);
}

export interface ItinerayModel {
  title: string;
  content: string;
  destination: string;
  dayWisePlan: string;
  tips: string;
  destinationSummary: string;
  weatherForecast: string;
  weatherType: string;
}

// Define an interface for the properties of a component or function that manages Itinerays.
export interface ItinerayProps {
  itinerary: ItinerayModel;
  resetState: () => void;
}

// Define a functional component named Itineray that accepts props of type ItinerayProps.
export const Itineray = (props: ItinerayProps) => {
  const printRef = React.useRef<HTMLDivElement>(null);

  //fxn to handle download pdf flwow
  const handleDownloadPdf = async () => {
    const element = printRef.current;
    if (!element) {
      console.error("Print element not found");
      return;
    }
    
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const data = canvas.toDataURL('image/png');
      console.log('canvas', canvas.width, canvas.height);
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas?.width, canvas?.height]
      });

      pdf.addImage(data, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save("travelItineray.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const { itinerary, resetState } = props;
  console.log('itinerary', itinerary);
  const flagSvg = findFlagUrlByCountryName(itinerary?.destination) || getRandomSvgPath('landScapeRandom');
  return (
    <>
      <ItineraryContainer ref={printRef}>
        <ItineraryTitle>{itinerary?.title}</ItineraryTitle>
        <Flex style={{ justifyContent: 'space-between' }}><ItineraryDates>{itinerary?.content}</ItineraryDates>
          <div>
            <Tooltip key={1} title="Please expand the day-wise list before downloading">
              <Button onClick={handleDownloadPdf} type="primary" style={{ margin: '12px', background: 'black' }}>Download PDF</Button>
            </Tooltip>
            <Button type="primary" style={{ marginBottom: '10px', background: 'black' }} onClick={resetState}>Reset</Button></div>
        </Flex>
        <Card
          bordered={false}>
          <Meta
            avatar={<Avatar src={flagSvg} />}
            title={itinerary?.destination.toUpperCase()}
            description={itinerary?.destinationSummary}
          />
        </Card>
        <div
          style={{
            display: 'flex', gap: '10px', maxHeight: '300px',
            overflow: 'scroll'
          }} >
          <Card
            style={{ marginTop: 16, width: '50%' }}
            bordered={false}>
            <Meta
              avatar={<Avatar src={`/${itinerary?.weatherType}.gif` || `/${defaults.icon}/gif`} style={{ width: 35 }} />}
              title={"Weather ForeCast"}
              description={itinerary?.weatherForecast}
            />
          </Card>
          <Card
            style={{ marginTop: 16, width: '50%' }}
            bordered={false}>
            <Meta
              avatar={
                <Avatar src={'/warning.gif'} style={{ width: 44 }} />}
              title={"Tips & Warnings"}
              description={tipsWarnings(itinerary?.tips)}
            />
          </Card>
        </div>
        <Collapse
          bordered
          className='day-wise-plan'
          items={[{
            key: '1', label: <Tooltip title="Click to expand/collapse"><div style={{
              fontWeight: 'bold', justifyContent: 'center',
              display: 'flex'
            }}><Avatar src={'/task.png'} style={{ height: 24, width: 24 }} />Day Wise Plan
            </div></Tooltip>, children: <DayWisePlanList dayWisePlan={itinerary?.dayWisePlan} />
          }]}
        />
        <Alert showIcon type="info" message="Please note that the above plan is tentative and is AI generated. So it may change based on the actual conditions." />
      </ItineraryContainer>
    </>
  );
};
