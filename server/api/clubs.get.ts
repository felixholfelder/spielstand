export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const query = getQuery(event)

    const formData = new FormData()
    formData.append('query', query.name)
    formData.append('page', query.page)
    formData.append('pagesize', 20)

    const result = await $fetch(
        `${config.public.baseApiUrl}/api/search/clubs`,
        {
            method: 'POST',
            body: formData,
            query: {
                _data: "",
            }
        }
    )

    return result
})
