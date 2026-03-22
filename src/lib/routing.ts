export const routes = {
    characterView: (id: string) => `/character/view?id=${encodeURIComponent(id)}`,
    characterEdit: (id: string) => `/character/edit?id=${encodeURIComponent(id)}`,
    campaignView: (id: string) => `/campaign/view?id=${encodeURIComponent(id)}`,
}