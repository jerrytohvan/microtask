import { get_gateway_url } from './src/utils'

export default {
    app: {
        gateway: get_gateway_url("https://dbdemo-wdahbs.gateway.dialogflow.cloud.ushakov.co"), // <- enter your gateway URL here, the function is just a helper function for my hosted integration. You don't normally need it
        muted: false, // <- mute microphone at start
        start_suggestions: [], // <- array of suggestions, displayed at the start screen
        fallback_lang: 'en', // <- fallback language code, if history mode or network is unavailable,
        voice: 'native' // <- voice of Text-To-Speech; for reference, see: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/voiceURI
    },
    i18n: {
        en: {
            welcomeTitle: "Welcome to",
            muteTitle: "Mute Toggle",
            inputTitle: "Type your message",
            sendTitle: "Send",
            microphoneTitle: "Voice Input"
        }
    }
}
