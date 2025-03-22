import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const autoLogin = async () => {
      try {
        const params = new URLSearchParams(); 
        params.append('email', 'teraabadi@gmail.com'); 
        params.append('password', 'teraabadi');

        const response = await axios.post('https://riset.its.ac.id/teratai-dev/api/v1/login', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded', // ✅ Set the correct content type
            },
        });
        // console.log(response.data.result.token)
        setToken(response.data.result.token);
        console.log('Login successful, token saved.');
      } catch (error) {
        console.error('Auto login failed:', error);
      }
    };

    autoLogin();
  }, []);

  return (
    <AuthContext.Provider value={{ token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);
