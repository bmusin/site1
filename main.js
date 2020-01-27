const ER_URL = 'https://www.cbr-xml-daily.ru/daily_json.js'
const API_URL = 'https://api.coindesk.com/v1/bpi/currentprice.json'

const store = new Vuex.Store({
	state: { list: [] },

	mutations: {
		clear_list(state) { state.list = [] },

        close_card(state, data) {
            for (let i = 0; i < state.list.length; ++i) {
				if (state.list[i].id == data.id) {
					state.list.splice(i, 1)
                    break
				}
			}
        },
        add_card(state, data) {
            state.list.push({
                id: Date.now(),
                date: data.date, dollars: data.dollars, roubles: data.roubles
            })
        }
	}
})

var MainCard = {
	data() {
		return {
			date:      null,
			dollars_: 'fetching...',
			roubles_: 'calculating...'
		}
	},
	computed: {
        roubles() { return this.roubles_ },
		dollars() { return this.dollars_ }
	},
    created() {
        let self = this
        axios.all([axios.get(API_URL), axios.get(ER_URL)])
            .then(axios.spread(function (respApi, respEr) {
            if (respApi.status === 200 && respEr.status === 200) {
                self.date = Date.now()
                self.dollars_ = respApi.data.bpi.USD.rate_float
                self.roubles_ = self.dollars_ / respEr.data.Valute.USD.Value
            }
        }))
    },
	template: `
		<div>
			<button class="card-btn" @click="$emit('main-card-refresh')">&#8635;</button>
			<button class="card-btn" @click="$emit('card-add', date, dollars, roubles)"
                :disabled="isNaN(dollars_) || isNaN(roubles_)">+</button>
			<button class="card-btn" @click="$emit('list-clear')"
                :disabled="!$store.state.list.length">x</button>
            <button class="card-btn" @click="$emit('pdf-download')"
                :disabled="!$store.state.list.length">&#8595;</button>
			<p>USD:  {{ dollars }}</p>
			<p>RUB:  {{ roubles }}</p>
			<p>Date: {{ new Date(date).toUTCString() }}</p>
		</div>
	`
}

var Card = {
	props: {
		id:   { type: Number, required: true	},
        data: { required: true }
	},
	template: `
		<div>
			<button class="card-btn" @click="$emit('card-close', id)">x</button>
			<p>USD:  {{ data.dollars }}</p>
			<p>RUB:  {{ data.roubles }}</p>
			<p>Date: {{ new Date(data.date).toUTCString() }}</p>
		</div>
	`
}

var vm = new Vue({
	el: '#vm',
	store,
	components: {
        'main-card': MainCard,
        'card':      Card
    },
	data: {
        mcKey: 0,
	},
	computed: {
		list() { return store.state.list },
	},
    methods: {
		closeCard(id) { store.commit('close_card', { id }) },

		addCard(date, dollars, roubles) {
            store.commit('add_card', { date: date, dollars: dollars, roubles: roubles })
		},
        downloadPdf() {
            let doc = new jsPDF()
			for (let i = 0; i < this.list.length; ++i) {
                tmp = this.list[i]
				doc.text(new Date(tmp.date).toUTCString()
                    + ' ' + tmp.dollars
                    + ':' + tmp.roubles, 10, (i+1)*10)
			}
			doc.save('values.pdf')
        }
	}
})
