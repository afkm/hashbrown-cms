'use strict';

/**
 * The client side content helper
 *
 * @memberof HashBrown.Client.Service
 */
class ContentService extends require('Common/Service/ContentService') {
    /**
     * Gets all ancestors of a Content node by id
     *
     * @param {String} id
     * @param {Boolean} includeSelf
     *
     * @returns {Array} Content node
     */
    static async getContentAncestorsById(id, includeSelf = false) {
        checkParam(id, 'id', String, true);

        let ancestors = [];
        let ancestorId = id;

        while(ancestorId) {
            let ancestor = await this.getContentById(ancestorId);

            if(ancestorId !== id || includeSelf) {
                ancestors.push(ancestor);
            }
            
            ancestorId = ancestor.parentId;
        }

        ancestors.reverse();

        return ancestors;
    }
    
    /**
     * Gets Content by id
     *
     * @param {String} id
     *
     * @returns {HashBrown.Entity.Resource.Content} Content node
     */
    static async getContentById(id) {
        checkParam(id, 'id', String, true);

        return await HashBrown.Service.ResourceService.get(HashBrown.Entity.Resource.Content, 'content', id);
    }
    
    /**
     * Gets all Content
     *
     * @returns {Array} Content nodes
     */
    static async getAllContent() {
        return await HashBrown.Service.ResourceService.getAll(HashBrown.Entity.Resource.Content, 'content');
    }
    
    /**
     * Sets Content by id
     *
     * @param {String} id
     * @param {HashBrown.Entity.Resource.Content} content
     */
    static setContentById(id, content) {
        checkParam(id, 'id', String);
        checkParam(content, 'content', HashBrown.Entity.Resource.Content);

        return HashBrown.Service.ResourceService.set('content', id, content);
    }

    /**
     * A check for field definitions
     *
     * @param {Object} definition
     *
     * @return {Boolean} Whether or not the definition is empty
     */
    static isFieldDefinitionEmpty(definition) {
        if(!definition) { return true; }

        let isEmpty = true;
        let checkRecursive = (object) => {
            if(object == undefined) { return; }

            // We consider a definition not empty, if it has a value that is not an object
            if(typeof object !== 'object') { return isEmpty = false; }

            for(let k in object) {
                checkRecursive(object[k]);
            }
        };
            
        checkRecursive(definition);

        return isEmpty;
    }

    /**
     * A sanity check for fields
     *
     * @param {Object} value
     * @param {Object} definition
     *
     * @return {Object} Checked value
     */
    static fieldSanityCheck(value, definition) {
        // If the definition value is set to multilingual, but the value isn't an object, convert it
        if(definition.multilingual && (!value || typeof value !== 'object')) {
            let oldValue = value;

            value = {};
            value[HashBrown.Context.language] = oldValue;
        }

        // If the definition value is not set to multilingual, but the value is an object
        // containing the _multilingual flag, convert it
        if(!definition.multilingual && value && typeof value === 'object' && value._multilingual) {
            value = value[HashBrown.Context.language];
        }

        // Update the _multilingual flag
        if(definition.multilingual && value && !value._multilingual) {
            value._multilingual = true;    
        
        } else if(!definition.multilingual && value && value._multilingual) {
            delete value._multilingual;

        }

        return value;
    }

    /**
     * Get new sort index
     *
     * @param {String} parentId
     * @param {String} aboveId
     * @param {String} belowId
     *
     * @return {Number} New index
     */
    static async getNewSortIndex(parentId, aboveId, belowId) {
        if(aboveId) {
            let aboveContent = await this.getContentById(aboveId);
            
            return aboveContent.sort + 1;
        }

        if(belowId) {
            let belowContent = await this.getContentById(belowId);
            
            return belowContent.sort + 1;
        }

        // Filter out content that doesn't have the same parent
        let allContent = await HashBrown.Service.ContentService.getAllContent();
        
        allContent.filter((x) => {
            return x.parentId == parentId || (!x.parentId && !parentId);
        });

        // Find new index
        // NOTE: The index should be the highest sort number + 10000 to give a bit of leg room for sorting later
        let newIndex = 10000;

        for(let content of allContent) {
            if(newIndex - 10000 <= content.sort) {
                newIndex = content.sort + 10000;
            }
        }

        return newIndex;
    }

    /**
     * Starts a tour of the content section
     */
    static async startTour() {
        if(location.hash.indexOf('content/') < 0) {
            location.hash = '/content/';
        }
       
        await new Promise((resolve) => { setTimeout(() => { resolve(); }, 500); });
            
        await UI.highlight('.navigation--resource-browser__tab[href="#/content/"]', 'This the content section, where you will do all of your authoring.', 'right', 'next');

        await UI.highlight('.panel', 'Here you will find all of your authored content, like web pages. You can right click here to create a content node.', 'right', 'next');
        
        await UI.highlight('.resource-editor', 'This is the content editor, where you edit content nodes.', 'left', 'next');
    }
}

module.exports = ContentService;
