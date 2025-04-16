"use client";

import { useCopilotContext } from "@copilotkit/react-core";
import { CopilotTask } from "@copilotkit/react-core";
import {
  useMakeCopilotActionable,
  useMakeCopilotReadable,
} from "@copilotkit/react-core";
import './style.scss';
import { Input, DatePicker, Button, Form, Divider, Spin, Typography, Card, Avatar, Flex, FloatButton, Col, Row, List } from 'antd';
const { Title,Link } = Typography;
import type { GetProps } from 'antd';
import dayjs from 'dayjs';
const { RangePicker } = DatePicker;
import { useState, useEffect, useCallback } from "react";
import isEmpty from "lodash/isEmpty";
import { Itineray } from "./ItinerayList";
import { useToast } from "./ToastContext";
import initErrorInterceptor from "./interceptErrorsMiddleware";

export const ActionButton = ({
  disabled, onClick, className, children,
}: {
  disabled: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <button
      disabled={disabled}
      className={`bg-blue-500 text-white font-bold py-2 px-4 rounded
      ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"}
      ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

import { weatherOptions } from "./constants";
import Image from "next/image";

export const Travel = ({ apiKey }: { apiKey: string }) => {
  const [formData, setFormData] = useState({});
  const [itinerary, setItinerary] = useState<any>({});
  const [generateItinerayTaskRunning, setGenerateItinerayTaskRunning] = useState(false);
  const { showToast } = useToast();
  
  // Add Error handler for CopilotKit responses
  const handleCopilotError = useCallback((error: any) => {
    console.error('CopilotKit error:', error, typeof error);
    
    // Specific handling for the "No function call occurred" error
    if (error?.message?.includes("No function call occurred")) {
      // This specific error indicates an issue with API authentication
      showToast(
        'error',
        'OpenAI API Error',
        'The AI service could not process your request. This is likely due to an invalid API key. Please check your API key and try again.'
      );
      
      // Set the API key error flag before removing the key
      localStorage.setItem('api_key_error', 'true');
      localStorage.setItem('api_key_error_message', 'Your API key was rejected by OpenAI with error: No function call occurred');
      
      // Reset the API key in localStorage to force re-authentication
      localStorage.removeItem('openai_api_key');
      
      // Force reload after a short delay to allow user to read the toast
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      return;
    }
    
    // Parse the error to extract meaningful information
    if (error?.code === 'invalid_api_key' || (error?.status === 401)) {
      // Authentication error
      showToast(
        'error',
        'API Key Error',
        error?.message || 'Your OpenAI API key appears to be invalid or has insufficient permissions. Please check and try again.'
      );
      
      // Set the API key error flag before removing the key
      localStorage.setItem('api_key_error', 'true');
      
      // Reset the API key in localStorage to force re-authentication
      localStorage.removeItem('openai_api_key');
      
      // Force reload after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
    } else if (error?.code === 'rate_limit_exceeded' || error?.status === 429) {
      // Rate limit error
      showToast(
        'warning',
        'Rate Limit Exceeded',
        error?.message || 'You have reached the rate limit for the OpenAI API. Please try again later.'
      );
    } else if (error?.message) {
      // Generic error with message
      showToast(
        'error',
        'AI Service Error',
        error.message || 'An error occurred while processing your request'
      );
    } else if (error?.error) {
      // Error has an 'error' field which might be a string or contain a message
      const errorMsg = typeof error.error === 'string' ? error.error : error.error.message || 'Unknown error';
      showToast(
        'error',
        'Something went wrong',
        errorMsg
      );
    } else {
      // Generic error without message
      showToast(
        'error',
        'Connection Error',
        'Failed to communicate with the AI service. Please check your internet connection and try again.'
      );
    }
  }, [showToast]);
  
  // Initialize the API error interceptor
  useEffect(() => {
    initErrorInterceptor();
    
    // Set up event listener for API errors
    const handleApiError = (event: CustomEvent<any>) => {
      console.log('API error event received:', event.detail);
      if (event.detail && event.detail.error) {
        handleCopilotError(event.detail.error);
      } else {
        console.error('Received malformed error event:', event);
        showToast(
          'error',
          'Unexpected Error',
          'An unexpected error occurred with the AI service'
        );
      }
    };
    
    // Add the event listener with the proper type
    window.addEventListener('copilotkit-api-error', handleApiError as EventListener);
    
    return () => {
      window.removeEventListener('copilotkit-api-error', handleApiError as EventListener);
    };
  }, [handleCopilotError, showToast]);
  
  // Add the API key to the formData and ensure it's stored in localStorage
  useEffect(() => {
    if (apiKey) {
      setFormData(prev => ({ ...prev, apiKey }));
      // Store in localStorage for persistence
      localStorage.setItem('openai_api_key', apiKey);
    }
  }, [apiKey]);

  useMakeCopilotActionable(
    {
      name: "generateItinerary",
      description: "Generate a travel itinerary Itineray based on the source, destination, and travel dates provided by the user.",
      argumentAnnotations: [
        {
          name: "destination",
          type: "string",
          description: "The destination of the trip.",
          required: true,
        },
        {
          name: "dayWisePlan",
          type: "string",
          description: "dayWise plan for the trip, make sure that the plan is in the format of day1 [Date]: activity1, activity2 ; day2 [Date]: activity1, activity2",
          required: true,
        },
        {
          name: "tips",
          type: "string",
          description: "Useful travel tips or advice specific to the destination or travel period.Any suggestions based on weather forecast.seperated by fullstop ",
          required: true,
        },
        {
          name: "destinationSummary",
          type: "string",
          description: "A brief summary of the destination, famous for, best time to visit, etc. Make sure to add Key highlights and not to miss events, places planned at the destination.",
          required: true,
        },
        {
          name: "weatherForecast",
          type: "string",
          description: "Weather forecast for the destination, make sure to include the weather forecast for the travel dates.",
          required: true,
        },
        {
          name: "weatherType",
          type: "string",
          description: `pass any relevant weather forecast for the destination,from these options: ${weatherOptions.join(", ")}`,
          required: true,
        },
        {
          name: "travelDates",
          type: "string",
          description: `pass the travel dates in the format of YYYY-MM-DD to YYYY-MM-DD`,
          required: true,
        }

      ],
      implementation: async (
        destination,
        dayWisePlan,
        tips,
        destinationSummary,
        weatherForecast,
        weatherType,
        travelDates
      ) => {
        console.log('formData', formData);
        const latestItineray = {
          destination,
          destinationSummary,
          title: `Your AI Generated Travel Itinerary to ${destination.toUpperCase()} is Ready`,
          content: `Travel Dates: ${travelDates}`,
          dayWisePlan,
          tips,
          weatherForecast,
          weatherType,
        };
        setItinerary({ ...latestItineray });
      },
    },
    [formData] // Dependency array for the hook.
  );

  useMakeCopilotReadable("This is the source destination , dates of travel and all details as submitted by User: " + JSON.stringify(formData));

  const context = useCopilotContext();
  
  const generateItinerary = new CopilotTask({
    includeCopilotActionable: true,
    instructions: "Generate a travel itinerary Itineray based on the source, destination, and travel dates provided by the user.",
    actions: [
      {
        name: "setMessage",
        description: "Set the travel itineray.",
        argumentAnnotations: [
          {
            name: "destination",
            type: "string",
            description: "The destination of the trip.",
            required: true,
          },
          {
            name: "dayWisePlan",
            type: "string",
            description: "dayWise plan for the trip, make sure that the plan is in the format of day1 [Date]: activity1, activity2 ; day2 [Date]: activity1, activity2",
            required: true,
          },
          {
            name: "tips",
            type: "string",
            description: "Useful travel tips or advice specific to the destination or travel period.seperated by fullstop",
            required: true,
          },
          {
            name: "destinationSummary",
            type: "string",
            description: "A brief summary of the destination, famous for, best time to visit, etc. Make sure to add Key highlights and not to miss events, places planned at the destination.",
            required: true,
          },
          {
            name: "weatherForecast",
            type: "string",
            description: "Weather forecast for the destination, make sure to include the weather forecast for the travel dates.",
            required: true,
          },
          {
            name: "travelDates",
            type: "string",
            description: `pass the travel dates in the format of YYYY-MM-DD to YYYY-MM-DD`,
            required: true,
          }
        ],
        implementation: async (
          destination,
          dayWisePlan,
          tips,
          destinationSummary,
          weatherForecast,
          weatherType,
          travelDates
        ) => {
          const latestItineray = {
            destination: (destination).toUpperCase(),
            destinationSummary,
            title: `Your AI Generated Travel Itinerary to ${destination.toUpperCase()} is Ready`,
            content: `Travel Dates: ${travelDates}`,
            dayWisePlan,
            tips,
            weatherType,
            weatherForecast,
          };
          setItinerary({ ...latestItineray });
        },
      }
    ]
  });

  type RangePickerProps = GetProps<typeof DatePicker.RangePicker>;

  const disabledDate: RangePickerProps['disabledDate'] = (current) => {
    // Can not select days before today and today
    return current && current < dayjs().endOf('day');
  };

  const SimpleInputComponent = () => {
    const [form] = Form.useForm();

    const onFinish = async (values: any) => {
      console.log('Received values of form: ', values, context);
      
      // Make sure to include the API key in form data
      const formDataWithApiKey = {
        ...values,
        apiKey // Include the API key from props
      };
      
      setFormData(formDataWithApiKey);
      setGenerateItinerayTaskRunning(true);
      
      try {
        await generateItinerary.run(context, formDataWithApiKey);
        showToast('success', 'Itinerary Generated', 'Your travel itinerary has been successfully created!');
      } catch (error) {
        console.error('Error running generateItinerary:', error);
        handleCopilotError(error);
      } finally {
        setGenerateItinerayTaskRunning(false);
        console.log('GenerateItinerary task completed');
      }
    };
    return (
      <Card>
        <Flex justify="space-between">
          <Image
            alt="avatar"
            src="/hiking.png"
            width={140}
            height={100}
          />
          <Flex vertical align="flex-start" style={{ padding: 32 }}>
            <Title level={2}>Lets get you started</Title>
            <span>Specify any location, even broadly like the South of India, and our AI will automatically tailor your trip accordingly. Just enter your desired region, and let our intelligent travel planner handle the rest, crafting a personalized itinerary that fits your travel aspirations perfectly.</span>
          </Flex>
        </Flex>
        <Divider className="divider-style" />
        <Card title="Please Enter the required details" hoverable className="card-input-style">
        <Spin tip="Generating Itineray..."  size="large" spinning={generateItinerayTaskRunning} style={{color:'black', top: '15px'}}>
        <Form
          form={form}
          layout="inline"
          initialValues={formData}
          onFinish={onFinish}
          style={{margin:'24px', display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'center', marginLeft: '15vh' }}
          autoComplete="on"
        >
          <Form.Item
            name="source"
            style={{ width: '400px',border: '2px solid black', borderRadius: '10px'}}
            rules={[{ required: true, message: 'Please input your Source!' }]}
          >
            <Input style={{height: '48px'}} placeholder="Enter a Source" />
          </Form.Item>

          <Form.Item
            name="destination"
            style={{ width: '400px',border: '2px solid black', borderRadius: '10px'}}
            rules={[{ required: true, message: 'Please input your destination!' }]}
          >
            <Input style={{height: '48px'}} size="large" placeholder="Enter a destination" />
          </Form.Item>

          <Form.Item
            name="dates"
            rules={[{ required: true, message: 'Please select your travel dates!' }]}
          >
            <RangePicker
              format="YYYY-MM-DD"
              style={{ width: '300px', height: '48px' }}
              disabledDate={disabledDate} />
          </Form.Item>
          <Form.Item>
            <Button ghost icon={<Avatar src={'/backpack.gif'}/>} size={'large'} type="primary" style={{ height: '48px',color: "black", boxShadow: "1px 1px 2px 1px black" }} htmlType="submit">
              Generate Itinerary
            </Button>
          </Form.Item>
        </Form>
        </Spin>
        </Card>
        </Card>
    );
  };

  const resetState = () => {
    setItinerary({});
    setFormData({});
  }
  const cardStyle: React.CSSProperties = {
    width: 620,
  };
  
  const imgStyle: React.CSSProperties = {
    display: 'block',
    width: 273,
  };
  return (
      <div className="background">
        {
          isEmpty(itinerary) &&
          (<>
            <Card hoverable className="input-field" style={{}}>
              <div style={{ display: 'inline-flex', gap: '20px' }}>
                <Image src={'/map.png'} width={120} height={60} alt="sd" />
                <div><Title level={1}>Travel Co-Pilot <Avatar src={'/plane.gif'} /></Title>
                  <Divider className="divider-style" />
                  <span>Discover the future of travel with our AI-powered travel planner! Effortlessly create customized itineraries, get accurate weather forecasts, and enjoy meticulously planned daily schedules. Packed with expert tips and insightful suggestions, this app is your ultimate travel companion, ensuring a seamless and enriched travel experience every time you explore.</span>
                </div>
              </div>
            </Card>
            <Divider style={{ background: 'white', margin: '12px' }} />
            <SimpleInputComponent />
            <Divider style={{ background: 'white', margin: '12px' }} />
            <Card title={<><Avatar src={'/fire-camp.gif'} style={{height:40 , width: 40}}/>Some Important Docs: </>} >
              <Row gutter={12} style={{display: 'flex', flexFlow: 'nowrap'}}>
              <Col span={4}>
                  <Image src={'/map-location.png'} width={120} height={60} alt="sd" />
                </Col>
                <Col span={8}>
                  <Card title="GitHub" bordered hoverable>
                  <Link href="https://github.com/sushantrana-dev" target="_blank">Click to here to view the code or contribute to the project</Link> 
                  </Card>
                </Col>
                
                <Col span={4}>
                  <Card title="Co-Pilot Kit" bordered hoverable>
                  <Link href="https://github.com/CopilotKit/CopilotKit" target="_blank"> Read More about the Co-pilot Kit.</Link> 
                  </Card>
                </Col>
                <Col span={8}>

                  <Card title="Tech Stack Used:" bordered hoverable >
                    <div style={{ display: 'flex' }}>
                      <List
                        size="small"
                        dataSource={['React', 'Next.js',]}
                        renderItem={item => <List.Item>{item}</List.Item>} />
                      <List
                        size="small"
                        dataSource={['Tailwind CSS', 'Ant Design',]}
                        renderItem={item => <List.Item>{item}</List.Item>} />
                      <List
                        size="small"
                        dataSource={['LangChain', 'Co-Pilot Kit']}
                        renderItem={item => <List.Item>{item}</List.Item>} />
                    </div>
                  </Card>
                </Col>
              </Row>
            </Card>
          </>)
        }
        {!isEmpty(itinerary) && (
          <Itineray itinerary={itinerary} resetState={resetState} />
        )}
      </div>
  );
};
