<template>
    <nav class="nav">
        <router-link to="/search">search</router-link>
        <router-link to="/about">about</router-link>
        <router-link to="/settings">settings</router-link>
        <router-link to="/privacy">privacy</router-link>
    </nav>
</template>

<style lang="scss" scoped>
.nav,
.footer {
    max-width: 568px;
    width: 100%;
    background: hsla(var(--mantle) / 1);
    border: 1px solid hsla(var(--subtext0) / 0.1);
    min-height: 5rem;
    padding: 0.75rem;
    border-radius: 3rem;
    margin: 1rem auto 0 auto;
}

.nav {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: stretch;
    gap: 0.5rem;
    padding: 0.5rem;
    overflow-x: auto;

    a {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1em;
        font-weight: 600;
        width: 9rem;

        background: hsla(var(--mantle) / 0.8);
        padding: 0.5rem 1rem;
        border-radius: 2rem;
        border: 1px solid hsla(var(--subtext0) / 0.1);
        color: hsl(var(--subtext1));
        text-decoration: none;
        transition: 0.2s cubic-bezier(0.2, 0, 0, 1);

        &:hover {
            background: hsla(var(--surface0) / 0.9);
            border-color: hsla(var(--blue) / 0.2);
            color: hsl(var(--blue));
        }

        &:active {
            background: hsla(var(--surface0) / 0.75);
            border-color: hsla(var(--blue) / 0.3);
            color: hsl(var(--blue));
        }

        &.router-link-exact-active {
            background: hsla(var(--blue) / 0.12);
            border-color: hsla(var(--blue) / 0.5);
            color: hsl(var(--blue));
            &:hover {
                background: hsla(var(--blue) / 0.15);
            }
            &:active {
                background: hsla(var(--blue) / 0.08);
            }
        }
    }
}
</style>
