<script setup lang="ts">
interface Club {
  external_id: string
  clubname: string
  clubnr: string
  organization_id: number
  organization_name: string
  organization_short: string
}

interface Team {
  season: string
  team_id: string
  team_name: string
  league_name: string
}

interface ClubsResponse {
  results: Club[]
  total_count: number
  pages_count: number
  page: number
  pagesize: number
}

interface TeamsResponse {
  data: {
    teams_list: {
      club_teams: Team[]
    }
  }
}

const search = ref('')
const clubs = ref<Club[]>([])
const selectedClub = ref<Club>()
const teams = ref<Team[]>([])
const selectedTeam = ref<Team>()
const page = ref(1)
const totalPages = ref(1)
const loading = ref(false)
const loadingMore = ref(false)


async function fetchClubs(reset = false) {
  if (reset) {
    loading.value = true
    page.value = 1
    clubs.value = []
  } else {
    loadingMore.value = true
  }

  try {
    const res = await $fetch<ClubsResponse>('/api/clubs', {
      query: { name: search.value, page: page.value }
    })

    res.results = res.results.filter(e => e.clubname !== "-kein-club-")

    clubs.value = reset ? res.results : [...clubs.value, ...res.results]
    totalPages.value = res.pages_count
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function fetchTeams() {
  try {
    console.log(selectedClub.value)
    const res = await $fetch<TeamsResponse>('/api/teams', {
      query: { association: selectedClub.value.organization_short, clubId: selectedClub.value.clubnr }
    })
    console.log(res)

    teams.value = res.data.teams_list.club_teams
  } catch (error) {
    console.error(error)
  }
}

let debounceTimer: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => fetchClubs(true), 300)
})

onMounted(() => fetchClubs(true))

watch(selectedClub, async (club) => {
  selectedTeam.value = null
  if (!club) {
    teams.value = []
    return
  }

  await fetchTeams()
})
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4">
        <p class="text-h6 mb-2">Wähle deinen Verein</p>

        <v-autocomplete
            v-model="selectedClub"
            v-model:search="search"
            :items="clubs"
            :loading="loading"
            item-title="clubname"
            item-value="clubnr"
            label="Verein suchen"
            variant="outlined"
            clearable
            no-filter
            return-object
        >
          <template #append-item>
            <div ref="sentinel" class="pa-2 text-center">
              <v-progress-circular
                  v-if="loadingMore"
                  indeterminate
                  size="20"
                  color="primary"
              />
            </div>
          </template>
          <template v-slot:item="{ props: itemProps, item }">
            <v-list-item v-model="item.clubnr" v-bind="itemProps" :title="item.clubname" :subtitle="item.organization_short"></v-list-item>
          </template>
          <template #no-data>
            <v-list-item>
              <v-list-item-title>Keine Vereine gefunden</v-list-item-title>
            </v-list-item>
          </template>
        </v-autocomplete>

        <p class="text-h6 mb-2">Mannschaft</p>
        <v-select
            v-model="selectedTeam"
            :items="teams"
            item-title="team_name"
            item-value="team_id"
            label="Mannschaft auswählen"
            variant="outlined"
            no-filter
            return-object
        >
          <template v-slot:item="{ props: itemProps, item }">
            <v-list-item v-bind="itemProps" :title="item.team_name" :subtitle="item.league_name"></v-list-item>
          </template>
          <template #no-data>
            <v-list-item>
              <v-list-item-title>Keine Mannschaften gefunden</v-list-item-title>
            </v-list-item>
          </template>
        </v-select>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>