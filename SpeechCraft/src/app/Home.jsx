import React from 'react';
import Button from '../components/Button';
import { Link, useNavigate } from 'react-router-dom';
import { txtColor } from '../constant/Colors';
import { ImLinkedin } from "react-icons/im";
import { IoLogoInstagram } from "react-icons/io";
import { SiFiverr, SiFreelancer } from "react-icons/si";
import { motion } from 'framer-motion';
import { useMediaQuery } from 'react-responsive';

// Variants for individual sections
const variants = {
    container: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.3 } },
    },
    section1: {
        hidden: { opacity: 0, x: -100 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.8 } },
    },
    section2: {
        hidden: { opacity: 0, x: 100 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.8 } },
    },
    section3: {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
    },
};

const Home = () => {
    const navigate = useNavigate();
    const isSmallPhone = useMediaQuery({ query: '(max-width: 480px)' }); // Small phones
  
    

    //styles
    const styles = {
        container: {
            display: 'flex',
            textAlign: 'center',
            height: isMobile ? '100vh' : '80vh',
            width: isMobile ? '70%' : '50%',
            justifyContent: 'space-between',
            flexDirection: 'column',
            alignItems: 'center',
            margin: 'auto',
        },
        mainContainer: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: '10%',
            flexDirection: 'column',
            gap: '2rem',
        },
        text: {
            fontSize: isMobile ? '25px' : '40px',
            lineHeight: 1.25,
            fontWeight: 'extra-bold',
            color: txtColor,
        },
        paragraph: {
            fontSize: isMobile ? '15px' : '18px',
            color: txtColor,
            lineHeight: 1.5,
        },
        socialMediaContainer: {
            display: 'flex',
            gap: '20px',
            marginTop: '20px',
        },
        icon: {
            fontSize: '30px',
            color: txtColor,
        },
    };
    

    return (
        <motion.div
            style={styles.container}
            initial="hidden"
            animate="visible"
            variants={variants.container}
        >
            <motion.div style={styles.mainContainer} variants={variants.section1}>
                <motion.h1 style={styles.text}>
                    Transform Speech Into Text <br />
                    With Unmatched Accuracy
                </motion.h1>
                <motion.p style={styles.paragraph}>
                    SpeechCraft is a powerful AI tool that can transcribe speech into text with unmatched accuracy. <br />
                    It uses advanced natural language processing techniques to analyze the speech and translate it into text. <br />
                    Simply upload your audio file, and the tool will provide you with the translated text.
                </motion.p>
                <Button
                    text="Get Started"
                    onClick={() => navigate('/transcribe-audio')}
                />
            </motion.div>

            <motion.div variants={variants.section2} >
                <motion.p style={styles.paragraph}>Connect with me</motion.p>
                <motion.div style={styles.socialMediaContainer}>
                    <Link to="" className="icons">
                        <IoLogoInstagram style={styles.icon} />
                    </Link>
                    <Link to="" className="icons">
                        <ImLinkedin style={styles.icon} />
                    </Link>
                    <Link to="" className="icons">
                        <SiFiverr style={styles.icon} />
                    </Link>
                    <Link to="" className="icons">
                        <SiFreelancer style={styles.icon} />
                    </Link>
                </motion.div>
            </motion.div>

            <motion.div variants={variants.section3} style = {{paddingBottom: '20px'}}>
                <motion.p style={styles.paragraph}>Built using AssemblyAI’s Universal-2 API.</motion.p>
            </motion.div>
        </motion.div>
    );
};


export default Home;






