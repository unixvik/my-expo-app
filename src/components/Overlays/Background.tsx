import {StyleSheet, ImageBackground, Text, View} from 'react-native';
import {AppText} from "@/Common/AppText";

export function Background() {
    return (
        <View style={styles.container}>
            <ImageBackground
                source={require('@/assets/images/table.jpg')}
                resizeMode="stretch"
                style={styles.image}
            >
                {/*<AppText style={styles.text}>Welcome to Claim</AppText>*/}
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        // backgroundColor: '#ff0000',
        // alignSelf:"center",
        // transform:[
        //     {translateX: "-50%"},
        // ]
        //     flex: 1,
    },
    image: {
        // flex: 1,
        zIndex: 1000,
        // justifyContent: 'center',
        resizeMode: "cover"
    },
    text: {
        color: 'white',
        fontSize: 42,
        lineHeight: 84,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: '#000000c0', // Semi-transparent overlay for readability
    },
});

