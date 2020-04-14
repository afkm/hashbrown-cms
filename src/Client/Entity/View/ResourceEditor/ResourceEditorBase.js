'use strict';

const HEARTBEAT_INTERVAL  = 1000 * 60; // 1 minute between each heartbeat
const HEARTBEAT_TIMEOUT  = 1000 * 5; // An extra 5 seconds waiting time when checking for last heartbeat

/**
 * The base class for resource editors
 *
 * @memberof HashBrown.Client.Entity.View.ResourceEditor
 */
class ResourceEditorBase extends HashBrown.Entity.View.ViewBase {
    static get category() { return null; }
    static get itemType() { return HashBrown.Entity.Resource.ResourceBase.getModel(this.category); }

    get category() { return this.constructor.category; }
    get itemType() { return this.constructor.itemType; }

    /**
     * Constructor
     */
    constructor(params) {
        super(params);

        this.state.saveOptions = this.state.saveOptions || {};
        this.state.settings = this.state.settings || {};
    }

    /**
     * Structure
     */
    structure() {
        super.structure();

        this.def(Boolean, 'isDirty', false);
    }

    /**
     * Gets the placeholder
     *
     * @return {HTMLElement} Placeholder
     */
    getPlaceholder(_, model, state) {
        return _.div({class: 'resource-editor loading'},
            _.div({class: 'resource-editor__header'}),
            _.div({class: 'resource-editor__body'}),
            _.div({class: 'resource-editor__footer'})
        );
    }
    
    /**
     * Checks whether this resource is currently being edited by someone else, and displays a warning if it is
     */
    editedCheck() {
        if(
            this.model &&
            this.model.viewedBy &&
            this.model.viewedOn &&
            this.model.viewedBy !== this.context.user.id &&
            new Date() - this.model.viewedOn < HEARTBEAT_INTERVAL + HEARTBEAT_TIMEOUT
        ) {
            let modal = UI.confirm('Resource busy', `"${this.state.title}" is currently being edited by someone else. Do you still want to proceed?`);

            modal.on('no', () => {
                location.hash = '/' + this.category + '/';
            });
        }
    }
    
    /**
     * Init
     */
    async init() {
        this.setDirty(false);

        this.state.category = HashBrown.Service.NavigationService.getRoute(0);
        this.state.id = HashBrown.Service.NavigationService.getRoute(1);

        if(!this.state.id || this.state.id === 'settings' || this.state.id === 'overview') {
            this.state.tab = this.state.id || 'overview';
            this.state.id = null;
            this.state.name = 'welcome';
        
        } else {
            this.state.tab = HashBrown.Service.NavigationService.getRoute(2);
            this.state.name = undefined;
       
        }

        await super.init();
        
        this.editedCheck();
    }

    /**
     * Fetches the model
     */
    async fetch() {
        if(this.state.id) {
            this.model = await this.itemType.get(this.state.id);

        } else {
            this.model = null;
        }

        if(this.model) {
            this.state.title = this.model.getName();
        
        } else {
            this.state.title = this.category[0].toUpperCase() + this.category.substring(1);

        }

        this.state.icon = this.itemType.icon;
    
        if(this.state.name === 'welcome') {
            this.state.tabs = {
                overview: 'Overview'
            };

            if(this.context.user.isAdmin && this.state.hasSettings) {
                this.state.tabs.settings = 'Settings';
            }
        
        } else {
            this.state.tabs = null;

        }
    }
 
    /**
     * Override render to maintain scroll position
     */
    render() {
        // Cache scroll position
        let body = this.namedElements.body;

        if(body instanceof HashBrown.Entity.View.ViewBase) {
            body = body.element;
        }
        
        let scrollTop = 0;

        if(body) {
            scrollTop = body.scrollTop;
        }

        super.render();
        
        // Restore scroll position
        body = this.namedElements.body;

        if(body instanceof HashBrown.Entity.View.ViewBase) {
            body = body.element;
        }
        
        if(body) {
            body.scrollTop = scrollTop;
        }
    }

    /**
     * Sets this editor dirty/clean
     *
     * @param {Boolean} isDirty
     */
    setDirty(isDirty) {
        this.isDirty = isDirty === true;

        let title = document.querySelector('title');

        if(this.isDirty && title.innerHTML.indexOf(' *') < 0) {
            title.innerHTML += ' *';
        
        } else if(!this.isDirty && title.innerHTML.indexOf(' *') > -1) {
            title.innerHTML = title.innerHTML.replace(' *', '');

        }
    }

    /**
     * Event: Heartbeat
     */
    async onHeartbeat() {
        if(
            typeof this === 'undefined' ||
            !this ||
            !this.model ||
            Object.keys(this.model).length < 1 ||
            !this.element ||
            !this.element.parentElement
        ) { return; }

        try {
            await this.model.heartbeat();

        } catch(e) {
            if(e && e.message) {
                debug.error(e, this, true);
            }
        
        } finally {
            this.state.lastHeartbeat = Date.now();

        }
    }
    
    /**
     * Event: Change a specific value
     *
     * @param {String} key
     * @param {*} value
     */
    onChangeValue(key, value) {
        if(!this.model || this.model.isLocked) { return; }
        
        this.model[key] = value;

        this.onChange();
    }

    /**
     * Event: Change happened
     */
    onChange() {
        if(!this.model || this.model.isLocked) { return; }

        if((this.state.lastHeartbeat || 0) + HEARTBEAT_INTERVAL < Date.now()) {
            this.onHeartbeat();
        }

        this.setDirty(true);
        this.trigger('change', this.model);
    }
    
    /**
     * Event: Click save settings
     */
    async onClickSaveSettings() {
        if(this.namedElements.save) {
            this.namedElements.save.classList.toggle('loading', true);
        }

        await this.context.project.setEnvironmentSettings(this.context.environment, this.state.settings);

        UI.notifySmall(`${this.state.title} settings saved successfully`, null, 3);

        if(this.namedElements.save) {
            this.namedElements.save.classList.toggle('loading', false);
        }

        this.render();
    }

    /**
     * Event: Click save
     */
    async onClickSave() {
        if(!this.model) { return; }

        this.state.title = this.model.getName();

        if(this.namedElements.save) {
            this.namedElements.save.classList.toggle('loading', true);
        }

        await this.model.save(this.state.saveOptions);

        UI.notifySmall(`"${this.state.title}" saved successfully`, null, 3);

        this.setDirty(false);
        
        if(this.namedElements.save) {
            this.namedElements.save.classList.toggle('loading', false);
        }

        this.render();
    }
    
    /**
     * Event: Click new
     */
    async onClickNew() {
        let resource = await this.itemType.create();
        
        location.hash = `/${this.category}/${resource.id}`;
    }
}

module.exports = ResourceEditorBase;
