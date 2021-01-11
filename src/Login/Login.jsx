import React, {useState, useEffect} from "react";
import { AlertCentralContext } from '../Components/AlertCentral';
import { Card, Form } from "react-bootstrap";
import FormControl from 'react-bootstrap/FormControl'
import XmanLogo from '../Images/XmanLogo.png';
import { BeatLoader } from 'react-spinners'
import Button from '../Components/Button'
import { ErrorMessage, Formik } from 'formik';
import * as yup from 'yup';
import './Login.css'
import AuthController from "../Controllers/AuthController";
import { useContext } from "react";
import { LocalizationContext } from "../Controllers/LocalizationStore";
import {FirebaseContext} from "../Firebase"

const schema = yup.object({
    username: yup.string().required('Username is required'),
    password: yup.string().required('Password is required'),
})


/**
 * The Login page
 * @param {Object} props 
 * @param {function} props.onSuccessfulLogin
 */
const Login = props => {
    const { locale } = useContext(LocalizationContext)
    const {analytics} = useContext(FirebaseContext)
    const [isLoading, setIsLoading] = useState(false);
    const [isWrong, setIsWrong] = useState(false);
    const [errorMessage, setErrorMessage] = useState("")
    
    const handleLoginKeyPress = event => event.key === 'Enter' && handleSubmit ()
	const handleSubmit = async (evt) => {
        setIsWrong(false)
        if (isLoading) return
        const username = document.getElementById ('username-entry').value
        const password = document.getElementById ('password-entry').value
        setIsLoading(true)
        try {
            const authContorller =new AuthController ()
            await authContorller.login (username, password)
            const user = await authContorller.user()
            analytics.logEvent('login',{userId:user.id,teamId:user.teamId})
            analytics.setUserProperties({most_recent_login:new Date(Date.now())})
            props.onSuccessfulLogin ()
        } catch (error) {
            console.error (error)
            setIsWrong(true)
            setErrorMessage(error.message)
        }
        
		setIsLoading(false) 

             
    }
    /** add event listener for enter key */
    useEffect (() => {
        document.addEventListener ('keydown', handleLoginKeyPress)
        return () => document.removeEventListener ('keydown', handleLoginKeyPress)
    }, [])

    return(
        <div className="login-page">
            <Card className="login-card">
                <Card.Img src={XmanLogo} className="login-logo"/>
                {/*<Card.Title className="login-title">Sign In</Card.Title>*/}
                <Formik
                    validationSchema={schema}
                    onSubmit={handleSubmit}
                    initialValues={{username:'', password:'',}}>
                    {({
                         handleSubmit,
                         handleChange,
                         handleBlur,
                         values,
                         touched,
                         isInvalid,
                         errors,
                     }) => (
                                   
                            <Form noValidate onSubmit={handleSubmit} className='login-form-pannel'>
                                <Form.Group controlId='username'>
                                    <Card.Text className="login-prompt">{locale.username}</Card.Text>
                                    <Form.Control type="text" className="login-form" name='username' value={values.username} placeholder={locale.username} id="username-entry" isInvalid={touched.username && errors.username} onChange={handleChange} onBlur={handleBlur}></Form.Control>
                                    <Form.Control.Feedback type='invalid'>{errors.username}</Form.Control.Feedback>
                                </Form.Group>
                                <Form.Group controlId='password'>
                                    <Card.Text className="login-prompt">{locale.password}</Card.Text>
                                    <Form.Control type="password" className="login-form" name='password' value={values.password} placeholder={locale.password} id="password-entry" isInvalid={touched.password && errors.password} onChange={handleChange} onBlur={handleBlur}></Form.Control>
                                    <Form.Control.Feedback type='invalid'>{errors.password}</Form.Control.Feedback>
                                </Form.Group>
                                { isWrong && <div className='form-feedback'>{errorMessage}</div> }
                                <Button type='submit' className='login-button' disabled={isLoading} isInvalid={errors.login} data-color="secondary">
                                    {
                                        !isLoading ?
                                        locale.login :
                                        <BeatLoader loading={true} color='#f0f8ff' size='16px'/>
                                    }
                                </Button>
                            </Form>
                            )}
                        </Formik>
                    {/*<Card.Text className="login-forget-password">Forgot Password</Card.Text>*/}
                </Card>
        </div>
    )
}

export default Login;