import { useState, useEffect } from "react";
import { Input, Button, Form, Card, Typography, Alert, Divider, Avatar, Image } from 'antd';
import { useToast } from "./ToastContext";

const { Title, Text } = Typography;

// Define props interface inline
interface ApiKeyInputProps {
  onApiKeySubmit: (apiKey: string) => void;
  isLoading?: boolean;
}

const ApiKeyInput = ({ onApiKeySubmit, isLoading = false }: ApiKeyInputProps) => {
  const [form] = Form.useForm();
  const { showToast } = useToast();
  const [validationError, setValidationError] = useState<string | null>(null);
  const [wasReset, setWasReset] = useState<boolean>(false);

  // Check if API key was reset due to an error
  useEffect(() => {
    const apiKeyError = localStorage.getItem('api_key_error');
    if (apiKeyError) {
      // Clear the flag
      localStorage.removeItem('api_key_error');
      setWasReset(true);
      
      // Show a toast explaining why they were returned to this screen
      showToast(
        'error',
        'API Key Invalid',
        'Your previous API key was rejected by OpenAI. Please provide a valid API key.'
      );
    }
  }, [showToast]);

  const validateApiKey = (key: string): boolean => {
    // Check if key starts with sk-
    if (!key.startsWith('sk-')) {
      setValidationError('Invalid API key format. OpenAI API keys should start with "sk-"');
      showToast('error', 'Invalid API Key Format', 'OpenAI API keys should start with "sk-"');
      return false;
    }
    
    // Check minimum length
    if (key.length < 40) {
      setValidationError('API key is too short. OpenAI API keys are typically at least 40 characters long');
      showToast('error', 'Invalid API Key', 'Your API key appears to be too short');
      return false;
    }
    
    // Clear any previous errors
    setValidationError(null);
    return true;
  };

  const onFinish = (values: { apiKey: string }) => {
    const apiKey = values.apiKey.trim();
    
    if (validateApiKey(apiKey)) {
      onApiKeySubmit(apiKey);
      showToast('success', 'API Key Set', 'Your API key has been successfully saved for this session');
    }
  };

  return (
    <Card className="api-key-card" 
      style={{ 
        maxWidth: '800px', 
        margin: '0 auto 24px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
      }}
      hoverable
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <Avatar src="/plane.gif" style={{ marginRight: '12px' }} />
        <Title level={2} style={{ margin: 0 }}>Welcome to Travel Co-Pilot</Title>
      </div>
      
      <Divider style={{ margin: '16px 0' }} />
      
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
        <Image src="/map.png" width={100} height={60} alt="Map" />
        <div>
          <Title level={3} style={{ marginTop: 0 }}>Enter Your OpenAI API Key</Title>
          <Text>To use our AI-powered travel planner, please provide your OpenAI API key.</Text>
        </div>
      </div>
      
      <Alert
        type="info"
        showIcon
        message="Your API key is required to use this application"
        description={
          <Text>
            We do not store your API key. It will only be used for the current session
            and securely transmitted to OpenAI for API requests. For security, you can create a
            temporary API key with usage limits at{' '}
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
              platform.openai.com
            </a>.
          </Text>
        }
        style={{ marginBottom: '20px' }}
      />
      
      {wasReset && (
        <Alert
          type="error"
          showIcon
          message="Previous API Key Rejected"
          description="Your previous API key was rejected by OpenAI. Please provide a valid API key from your OpenAI account."
          style={{ marginBottom: '20px' }}
        />
      )}
      
      {validationError && (
        <Alert
          type="error"
          showIcon
          message="API Key Error"
          description={validationError}
          style={{ marginBottom: '20px' }}
        />
      )}
      
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          name="apiKey"
          rules={[
            { required: true, message: 'Please enter your OpenAI API key' },
            { min: 30, message: 'API key should be at least 30 characters long' }
          ]}
        >
          <Input.Password 
            placeholder="sk-..." 
            size="large"
            style={{ 
              border: '2px solid black', 
              borderRadius: '10px',
              height: '48px'
            }}
          />
        </Form.Item>
        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={isLoading}
            icon={<Avatar src="/backpack.gif" style={{ marginRight: '8px' }} />}
            ghost
            size="large"
            style={{ 
              height: '48px',
              color: "black", 
              boxShadow: "1px 1px 2px 1px black",
              display: 'flex',
              alignItems: 'center'
            }}
          >
            Start Planning Your Trip
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ApiKeyInput; 