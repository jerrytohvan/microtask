<template>
    <main id="app">
        <!-- TopHead is the header with the information about the app -->
        <TopHead v-if="app && messages.length > 0" :app="app"></TopHead>
        <section class="container chat-container" v-hammer:swipe="onSwipe" v-hammer:tap="onDoubleTap">
            

            <!-- Error component is for displaying errors -->
            <Error v-if="error" :error="error"></Error>

            <!-- Welcome component is for onboarding experience and language picker -->
            <Welcome v-if="app && messages.length == 0" :app="app"></Welcome>

            <!-- Messages Table -->
            <section v-else>
                <table v-for="m in messages" class="message">
                    <tr>
                        <!-- My message -->
                        <Bubble :text="m.queryResult.queryText" from="me" />
                    </tr>

                    <!-- Dialogflow Components -->
                    <tr class="component" v-for="component in m.queryResult.fulfillmentMessages">
                        <!-- Text (https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/projects.agent.intents#Text) -->
                        <Bubble :text="component.text.text[0]" v-if="component.text" />

                        <!-- SimpleResponses (https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/projects.agent.intents#SimpleResponses) -->
                        <Bubble
                            :text="component.simpleResponses.simpleResponses[0].displayText || component.simpleResponses.simpleResponses[0].textToSpeech"
                            v-if="component.simpleResponses" />

                        <!-- Card (https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/projects.agent.intents#Card) -->
                        <Card
                            :title="component.card.title"
                            :subtitle="component.card.subtitle"
                            :imageUri="component.card.imageUri"
                            v-if="component.card">
                            <CardButton
                                v-for="button in component.card.buttons"
                                :key="button.text"
                                :uri="button.postback"
                                :title="button.text"
                            />
                        </Card>

                        <!-- BasicCard (https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/projects.agent.intents#BasicCard) -->
                        <Card
                            :title="component.basicCard.title"
                            :subtitle="component.basicCard.subtitle"
                            :imageUri="component.basicCard.image.imageUri"
                            :imageTitle="component.basicCard.image.accessibilityText"
                            :text="component.basicCard.formattedText"
                            v-if="component.basicCard">
                            <CardButton
                                v-for="button in component.basicCard.buttons"
                                :key="button.title"
                                :uri="button.openUriAction.uri"
                                :title="button.title" 
                            />
                        </Card>

                        <!-- CarouselSelect (https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/projects.agent.intents#CarouselSelect) -->
                        <Carousel v-if="component.carouselSelect">
                            <Card
                                v-for="item in component.carouselSelect.items"
                                @click.native="send(item.info.key)"
                                :key="item.info.key"
                                :title="item.title"
                                :imageUri="item.image.imageUri"
                                :imageTitle="item.image.accessibilityText"
                                :text="item.description"
                            />
                        </Carousel>

                        <!-- ListSelect (https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/projects.agent.intents#ListSelect) -->
                        <List
                            :title="component.listSelect.title"
                            :subtitle="component.listSelect.subtitle"
                            v-if="component.listSelect">
                            <ListItem
                                v-for="item in component.listSelect.items"
                                @click.native="send(item.info.key)"
                                :key="item.title"
                                :title="item.title"
                                :description="item.description"
                                :imageUri="item.image.imageUri"
                                :imageTitle="item.image.accessibilityText"
                            />
                        </List>

                        <!-- Image (https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/projects.agent.intents#Image) -->
                        <Picture v-if="component.image" :uri="component.image.imageUri" :title="component.image.accessibilityText" />
                    </tr>

                    <!-- Actions on Google Components -->
                    <section v-if="m.queryResult.webhookPayload && m.queryResult.webhookPayload.google">
                        <tr class="component" v-for="component in m.queryResult.webhookPayload.google.richResponse.items">
                            <!-- Simple response (https://developers.google.com/actions/assistant/responses#simple_response) -->
                            <Bubble
                                :text="component.simpleResponse.displayText || component.simpleResponse.textToSpeech"
                                v-if="component.simpleResponse" />

                            <!-- Basic card (https://developers.google.com/actions/assistant/responses#basic_card) -->
                            <Card
                                :title="component.basicCard.title"
                                :subtitle="component.basicCard.subtitle"
                                :imageUri="component.basicCard.image.url"
                                :imageTitle="component.basicCard.image.accessibilityText"
                                :text="component.basicCard.formattedText"
                                v-if="component.basicCard">
                                <CardButton
                                    v-for="button in component.basicCard.buttons"
                                    :key="button.title"
                                    :uri="button.openUrlAction.url"
                                    :title="button.title"
                                />
                            </Card>

                            <!-- Browsing Carousel (https://developers.google.com/actions/assistant/responses#browsing_carousel) -->
                            <List v-if="component.carouselBrowse">
                                <ListItem
                                    v-for="item in component.carouselBrowse.items"
                                    :key="item.title"
                                    :uri="item.openUrlAction.url"
                                    :title="item.title"
                                    :description="item.description"
                                    :footer="item.footer"
                                    :imageUri="item.image.url"
                                    :imageTitle="item.image.accessibilityText"
                                />
                            </List>

                            <!-- Media responses (https://developers.google.com/actions/assistant/responses#media_responses) -->
                            <div v-if="component.mediaResponse && component.mediaResponse.mediaObjects">
                                <Media
                                    v-for="media in component.mediaResponse.mediaObjects"
                                    :name="media.name"
                                    :key="media.name"
                                    :description="media.description"
                                    :iconUri="media.icon.url"
                                    :iconTitle="media.icon.accessibilityText"
                                    :uri="media.contentUrl"
                                />
                            </div>

                            <!-- Table cards (https://developers.google.com/actions/assistant/responses#table_cards) -->
                            <TableCard
                                :title="component.tableCard.title"
                                :subtitle="component.tableCard.subtitle"
                                :imageUri="component.tableCard.image.url"
                                :imageTitle="component.tableCard.image.accessibilityText"
                                :header="component.tableCard.columnProperties"
                                :rows="component.tableCard.rows"
                                v-if="component.tableCard">
                                <CardButton
                                    v-for="button in component.tableCard.buttons"
                                    :key="button.title"
                                    :uri="button.openUrlAction.url"
                                    :title="button.title"
                                />
                            </TableCard>
                        </tr>

                        <!-- Visual Selection Responses (https://developers.google.com/actions/assistant/responses#visual_selection_responses) -->
                        <tr class="component" v-for="component in m.queryResult.webhookPayload.google.systemIntent">
                            <!-- List (https://developers.google.com/actions/assistant/responses#list) -->
                            <List
                                :title="component.listSelect.title"
                                :subtitle="component.listSelect.subtitle"
                                v-if="component.listSelect">
                                <ListItem
                                    @click.native="send(item.optionInfo.key)"
                                    v-for="item in component.listSelect.items"
                                    :key="item.optionInfo.key"
                                    :title="item.title"
                                    :description="item.description"
                                    :imageUri="item.image.url"
                                    :imageTitle="item.image.accessibilityText"
                                />
                            </List>

                            <!-- Carousel (https://developers.google.com/actions/assistant/responses#carousel) -->
                            <Carousel v-if="component.carouselSelect">
                                <Card
                                    v-for="item in component.carouselSelect.items"
                                    @click.native="send(item.optionInfo.key)"
                                    :key="item.optionInfo.key"
                                    :title="item.title"
                                    :imageUri="item.image.url"
                                    :imageTitle="item.image.accessibilityText"
                                    :text="item.description"
                                />
                            </Carousel>
                        </tr>
                    </section>
                </table>
                <table class="message" v-if="loading">
                    <tr>
                        <!-- My message (Loading) -->
                        <td><Bubble from="me" loading="true" /></td>
                    </tr>
                    <tr>
                        <!-- Default / Webhook bubble (Loading) -->
                        <td><Bubble loading="true" /></td>
                    </tr>
                </table>
            </section>
        </section>

        <!-- ChatInput is made for submitting queries and displaying suggestions -->
        <ChatInput @submit="send">
            <!-- Suggestion chips
                https://developers.google.com/actions/assistant/responses#suggestion_chips
                https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/projects.agent.intents#QuickReplies
                https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/projects.agent.intents#Suggestions
            -->
            <Suggestion
                v-for="(suggestion, index) in suggestions.text_suggestions"
                @click.native="send(suggestion)"
                :key="index"
                :title="suggestion"
                v-if="suggestions.text_suggestions" />

            <!-- Link suggestion chips
                https://developers.google.com/actions/assistant/responses#suggestion_chips
                https://cloud.google.com/dialogflow/docs/reference/rest/v2beta1/projects.agent.intents#LinkOutSuggestion
            -->
            <Suggestion
                :title="suggestions.link_suggestion.destinationName"
                :url="suggestions.link_suggestion.uri || suggestions.link_suggestion.url"
                v-if="suggestions.link_suggestion" />
        </ChatInput>

        <!-- Audio toggle (on the top right corner), used to toggle the audio output, default mode is defined in the settings -->
        <div
            class="audio-toggle" 
            @click="muted = !muted"
            :aria-label="(config.i18n[lang()] && config.i18n[lang()].inputTitle) || config.i18n[config.app.fallback_lang].muteTitle"
            :title="(config.i18n[lang()] && config.i18n[lang()].inputTitle) || config.i18n[config.app.fallback_lang].muteTitle"
        >
            <i aria-hidden="true" class="material-icons" v-if="!muted">volume_up</i>
            <i aria-hidden="true" class="material-icons" v-else>volume_off</i>
        </div>
    </main>
</template>

<style lang="sass">
@import url('https://fonts.googleapis.com/css?family=Roboto:400,500,700')
@import url('https://fonts.googleapis.com/css?family=Material+Icons')

body
    margin: 0
    padding: 0
    font-family: Google Sans, Roboto, sans-serif
    font-display: swap
    background-color: var(--background)

.container
    max-width: 500px
    margin-left: auto
    margin-right: auto
    padding: 16px
    position: relative
</style>

<style lang="sass" scoped>
.chat-container
    padding-top: 60px
    padding-bottom: 125px

.message
    width: 100%
    table-layout: fixed

    .component
        padding-bottom: 10px
        width: 70%
        display: block

        @media screen and (max-width: 720px)
            width: 100%

.audio-toggle
    position: fixed
    top: 0
    right: 0
    margin: 8px
    z-index: 999
    padding: 10px
    background-color: var(--element-background)
    border-radius: 50%
    width: 24px
    height: 24px
    cursor: pointer
    color: var(--text)
</style>

<script>
import Welcome from './../Welcome/Welcome.vue'
import Error from './../Error/Error.vue'
import TopHead from './../Partials/TopHead.vue'
import ChatInput from './../Partials/ChatInput.vue'

import Bubble from './../RichComponents/Bubble.vue'
import Card from './../RichComponents/Card.vue'
import CardButton from './../RichComponents/CardButton.vue'
import Carousel from './../RichComponents/Carousel.vue'
import List from './../RichComponents/List.vue'
import ListItem from './../RichComponents/ListItem.vue'
import Picture from './../RichComponents/Picture.vue'
import Media from './../RichComponents/Media.vue'
import TableCard from './../RichComponents/TableCard.vue'
import Suggestion from './../RichComponents/Suggestion.vue'

import * as uuidv1 from 'uuid/v1'
import { set_seo } from './../../utils'
import './Theme.sass'

// import pg from 'pg'


/*
Set function for detecting  question and swapping options (SURVEY TASKS):

Alright got it $person! Let's jump in to the survey task! 
First question, which of the following social media do you currently have? You may choose more than one. 
Options: Google+, MySpace, Bebo, Tagged, Facebook, Twitter, Instagram or Others?

Great, thank you! Next, second question. in a typical week how likely are you to use social networking websites? 
Option: Extremely likely, very likely, moderate, slight likely, or not at all?

Great! Third question. 
In a typical week which of the following social networking websites do you use most often? 
Option: Facebook, Instagram, Twitter, Bebo, Tagged, MySpace, Google+, Google Hangouts, or other social network that you can mention?

Next question. Fourth question.
In a typical week, about how much time do you spend using social networking websites? How many hours or minutes?

Alright, fifth question. About how many "friends" do you currently have on social networking websites?

Alright, moving on. Sixth question. 
About how many of your "friends" on social networking websites have you met in person? 
Option: All of them, most of them, about half of them, a few of them, or none of them?

Got it!  Next, seventh question. 
If you could use only one of the following social networking services, which would you use? 
Options: Facebook, Instagram, Tagged, Google+, Bebo, MySpace, or Twitter?

    Got it, last question! 
From one to ten, scale how satisfied are you with your most used social network you have chosen earlier?
*/

//QUESTION 1,2,3,6,7
var options = [
  ["Google+", "MySpace", "Bebo", "Tagged", "Facebook", "Twitter", "Instagram", "for others, please use the text or mic input"],
  ["Extremely likely", "very likely", "moderate likely", "slight likely", "not at all"],
  ["Google+", "MySpace", "Bebo", "Tagged", "Facebook", "Twitter", "Instagram", "for others, please use the text or mic input"],
  ["All of them", "most of them", "about half of them", "a few of them", "none of them"],
  ["Facebook", "Instagram", "Tagged", "Google+", "Bebo", "MySpace", "Twitter"]
]

var sentiment_options = ["positive", "negative", "neutral", "none of them"]

var curr_option = ""
var index_option = 0
var ques_no = 0


/*
DB Info:
- If ask name not in DB (Create new user).
    At every new interaction create new session tagged to a user.

- At every interaction, user responses are all logged to detect difficult 


- How do you know task are completed and correct validation? reply has no "sorry" -> update DB
- Detecting start session and stop session (properly defined or when session restarts?)



*/


/*
TYPE
    0 = survey tasks
    1 = sentiment analysis
    2 = audio transcribtion
*/
var type = -1

export default {
    name: 'app',
    components: {
        Welcome,
        Error,
        TopHead,
        ChatInput,
        Bubble,
        Card,
        CardButton,
        Carousel,
        List,
        ListItem,
        Picture,
        Media,
        TableCard,
        Suggestion
    },
    data(){
        return {
            app: null,
            messages: [],
            language: '',
            session: '',
            muted: this.config.app.muted,
            loading: false,
            error: null
        }
    },
    created(){
        /* If history is enabled, the messages are retrieved from localStorage */
        if(this.history() && localStorage.getItem('message_history') !== null){
            this.messages = JSON.parse(localStorage.getItem('message_history'))
        }

        /* Session should be persistent (in case of page reload, the context should stay) */
        if(this.history() && localStorage.getItem('session') !== null){
            this.session = localStorage.getItem('session')
        }

        else {
            this.session = uuidv1()
            if(this.history()) localStorage.setItem('session', this.session)
        }

        /* Cache Agent (this will save bandwith) */
        if(this.history() && localStorage.getItem('agent') !== null){
            this.app = JSON.parse(localStorage.getItem('agent'))
        }

        else {
            fetch(this.config.app.gateway)
            .then(response => response.json())
            .then(agent => {
                if(!agent.error){
                    this.app = agent
                    if(this.history()) localStorage.setItem('agent', JSON.stringify(agent))
                }

                else {
                    this.error = agent.error
                }
            })
        }
    },
    computed: {
        /* The code below is used to extract suggestions from last message, to display it on ChatInput */
        suggestions(){
            if(this.messages.length > 0){
                let last_message = this.messages[this.messages.length - 1]
                let suggestions = []
                
                /* Dialogflow Suggestions */
                for (let component in last_message.queryResult.fulfillmentMessages){
                    if(last_message.queryResult.fulfillmentMessages[component].suggestions) suggestions.text_suggestions = last_message.queryResult.fulfillmentMessages[component].suggestions.suggestions.map(suggestion => suggestion.title)
                    if(last_message.queryResult.fulfillmentMessages[component].linkOutSuggestion) suggestions.link_suggestion = last_message.queryResult.fulfillmentMessages[component].linkOutSuggestion
                    if(last_message.queryResult.fulfillmentMessages[component].quickReplies) suggestions.text_suggestions = last_message.queryResult.fulfillmentMessages[component].quickReplies.quickReplies
                }

                /* Google Suggestions */
                if (last_message.queryResult.webhookPayload && last_message.queryResult.webhookPayload.google){
                    for (let component in last_message.queryResult.webhookPayload.google){
                        if(last_message.queryResult.webhookPayload.google[component].suggestions) suggestions.text_suggestions = last_message.queryResult.webhookPayload.google[component].suggestions.map(suggestion => suggestion.title)
                        if(last_message.queryResult.webhookPayload.google[component].linkOutSuggestion) suggestions.link_suggestion = last_message.queryResult.webhookPayload.google[component].linkOutSuggestion
                    }
                }

                return suggestions
            }
            
            else {
                return {
                    text_suggestions: this.config.app.start_suggestions // <- if no messages are present, return start_suggestions, from config.js to help user figure out what he can do with your application
                }
            }
        }
    },
    watch: {
        /* This function is triggered, when new messages arrive */
        messages(messages){
            if(this.history()) localStorage.setItem('message_history', JSON.stringify(messages)) // <- Save history if the feature is enabled
            

            /* MODIFICATION: Retrieve options from messages, add interaction from */ 

            
            /* MODIFICATION: Set gesture options and retrieve answer */ 

        },
        /* This function is triggered, when request is started or finished */
        loading(){
            setTimeout(() => {
                let app = document.querySelector('#app') // <- We need to scroll down #app, to prevent the whole page jumping to bottom, when using in iframe
                if (app.querySelector('.message')){
                    let message = app.querySelectorAll('.message')[app.querySelectorAll('.message').length - 1].offsetTop - 70
                    window.scrollTo({top: message, behavior: 'smooth'})
                }
            }, 2) // <- wait for render (timeout) and then smoothly scroll #app down to the last message
        },
        /* You don't need the function below. It's only for managed version, get the SEO right */
        app(agent){
            set_seo(agent)
        }
    },
    methods: {
        send(q){
            let request = {
                "queryInput": {
                    "text": {
                        "text": q,
                        "languageCode": this.lang()
                    }
                }
            } // <- this is how a Dialogflow request look like

            this.loading = true
            this.error = null

            /* Make the request to gateway */
            fetch(this.config.app.gateway + '/' + this.session, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(request)})
            .then(response => response.json())
            .then(response => {
                if(!response.error){
                    this.messages.push(response)
                    this.handle(response) // <- trigger the handle function (explanation below)
                    //console.log(response) // <- (optional) log responses
                }

                else {
                    this.error = response.error
                }
            })
            .then(() => this.loading = false)
        },
        handle(response){
            /* This function is used for speech output */
            let text // <- init a text variable

            /* Dialogflow Text/SimpleResponses */
            for (let component in response.queryResult.fulfillmentMessages){
                if(response.queryResult.fulfillmentMessages[component].text) text = response.queryResult.fulfillmentMessages[component].text.text[0]
                if(response.queryResult.fulfillmentMessages[component].simpleResponses) text = response.queryResult.fulfillmentMessages[component].simpleResponses.simpleResponses[0].textToSpeech
            }

            /* Actions on Google Simple response */
            if (response.queryResult.webhookPayload && response.queryResult.webhookPayload.google){
                for (let component in response.queryResult.webhookPayload.google){
                    if(response.queryResult.webhookPayload.google[component].simpleResponse) text = response.queryResult.webhookPayload.google[component].simpleResponse.textToSpeech
                }
            }
            console.log(text)
            this.setOptions(text)
            let speech = new SpeechSynthesisUtterance(text)
            speech.voiceURI = this.config.app.voice

            /* This "hack" is used to format our lang format, to some other lang format (example: en -> en_EN). Mainly for Safari, Firefox and Edge */
            speech.lang = this.lang() + '-' + this.lang().toUpperCase()
            if(!this.muted) window.speechSynthesis.speak(speech) // <- if app is not muted, speak out the speech
          
             /* MODIFICATION: Post-speech, buffer to audio signal and enable speech and gesture input  */ 
            

        }, 
        /* MODIFICATION: Generate gesture based option and speech
        
        var curr_option = ""
        var index_option = 0
        var ques_no = 0
        */


        onSwipe(event) {
            /* MODIFICATION: Swap option & trigger speech  */
         
            if (event.direction == 2) {
        
                //previous option

                if(ques_no != 0 && curr_option!= ""){

                    if(type == 1){
                        //if option index is 0, move to last option
                        var question_options_index = -1

                        //make sure its only for questions 
                        switch(ques_no) {
                            case 1:
                                // first ques
                                question_options_index = 0
                                break;
                            case 2:
                                // second
                                question_options_index = 1
                                break;
                            case 3:
                                // second
                                question_options_index = 2
                                break;
                            case 6:
                                // second
                                question_options_index = 3
                                break;
                            case 7:
                                // second
                                question_options_index = 4
                                break;
                        }
                        
                        if(question_options_index != -1){
                            if(index_option == 0){
                                index_option = options[question_options_index].length-1
                            }else{
                                index_option -= 1
                            }
                            curr_option = options[question_options_index][index_option]
                        }else{
                            curr_option = "Please use the voice or text input to record your answer."
                        }

                    }else if (type == 2){
                        if(index_option == 0){
                            index_option = sentiment_options.length-1
                        }else{
                            index_option -= 1
                        }
                        curr_option = sentiment_options[index_option]
                    }

                   
                    //vocalise
                    let speech = new SpeechSynthesisUtterance(curr_option)
                    speech.voiceURI = this.config.app.voice

                    /* This "hack" is used to format our lang format, to some other lang format (example: en -> en_EN). Mainly for Safari, Firefox and Edge */
                    speech.lang = this.lang() + '-' + this.lang().toUpperCase()
                    if(!this.muted) window.speechSynthesis.speak(speech) // <- if app is not muted, speak out the speech
                }
                
            }else if (event.direction == 4) {
                //next option
                if(ques_no != 0 && this.curr_option!= ""){
                    //if option index is 0, move to last option
                    if(type == 1){
                        var question_options_index = -1
                        //make sure its only for questions 
                        switch(ques_no) {
                            case 1:
                                // first ques
                                question_options_index = 0
                                break;
                            case 2:
                                // second
                                question_options_index = 1
                                break;
                            case 3:
                                // second
                                question_options_index = 2
                                break;
                            case 6:
                                // second
                                question_options_index = 3
                                break;
                            case 7:
                                // second
                                question_options_index = 4
                                break;
                        }
                        if(question_options_index != -1){
                            //if option index is 0, move to last option
                            if(index_option == options[question_options_index].length-1){
                                //back to start
                                index_option = 0
                            }else{
                                index_option += 1
                            }  
                            curr_option = options[question_options_index][index_option]
                        }else{
                            curr_option = "Please use the voice or text input to record your answer."
                        }
                    }else if(type == 2){
                        if(index_option == sentiment_options.length-1){
                            //back to start
                            index_option = 0
                        }else{
                            index_option += 1
                        }  
                        curr_option = sentiment_options[index_option]
                    }
                   

                    //vocalise
                    let speech = new SpeechSynthesisUtterance(curr_option)
                    speech.voiceURI = this.config.app.voice

                    /* This "hack" is used to format our lang format, to some other lang format (example: en -> en_EN). Mainly for Safari, Firefox and Edge */
                    speech.lang = this.lang() + '-' + this.lang().toUpperCase()
                    if(!this.muted) window.speechSynthesis.speak(speech) // <- if app is not muted, speak out the speech
                }
            }
        },
        //QUESTION 1,2,3,6,7
        setOptions(text){
            //initialise based on responses
            text = text.toLowerCase()

            if(type == -1 && text.includes("selected")){
                if(text.includes("survey")){
                    type = 1
                }else if(text.includes("sentiment")){
                    type = 2
                }else if(text.includes("audio")){
                    type = 3
                }
            }

            if(type == 1){
                if(text.includes("first")){
                    ques_no = 1
                    curr_option = options[0][index_option]
                }else if(text.includes("second")){
                    ques_no = 2
                    curr_option = options[1][index_option]
                }else if(text.includes("third")){
                    ques_no = 3
                    curr_option = options[2][index_option]
                }else if(text.includes("fourth")){
                    ques_no = 4
                }else if(text.includes("fifth")){
                    ques_no = 5
                }else if(text.includes("sixth")){
                    ques_no = 6
                    curr_option = options[3][index_option]
                }else if(text.includes("seventh")){
                    ques_no = 7
                    curr_option = options[4][index_option]
                }else if(text.includes("last")){
                    ques_no = 8
                }else{
                    ques_no = 0
                }
            }else if(type == 2){
                curr_option = sentiment_options[0]
                ques_no += 1
            }
           
        },
        onDoubleTap(event){
            console.log(event)
            if(event.tapCount == 2){

                curr_option = curr_option.toLowerCase()

                //if others selected repeat 
                if(!curr_option.includes("others")){
                    this.send(curr_option)
                    curr_option += " selected."
                }

                //vocalise
                let speech = new SpeechSynthesisUtterance(curr_option)
                speech.voiceURI = this.config.app.voice

                /* This "hack" is used to format our lang format, to some other lang format (example: en -> en_EN). Mainly for Safari, Firefox and Edge */
                speech.lang = this.lang() + '-' + this.lang().toUpperCase()
                if(!this.muted) window.speechSynthesis.speak(speech) // <- if app is not muted, speak out the speech
       
            }
        },
        saveToDB(type, response, ques_no, session_id){

        },
        checkSession(){
            // var query = pgClient.query("SELECT * from users")
            // query.on("row", function(row,result){
            //     result.addRow(row);
            //     console.log(result)
            // })
            // pgClient.end()



            //if user_id is -1, check if user is in DB, if not create a new one. If yes get user_id & allocate new session ID.



            //if session id is -1, create new session


        }
    }
}
</script>