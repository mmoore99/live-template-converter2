<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black bg-opacity-50" @click="close"></div>
    
    <!-- Modal -->
    <div class="relative bg-white rounded-lg shadow-xl w-[500px] max-h-[80vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b">
        <h3 class="text-lg font-semibold">Select Scopes</h3>
        <button 
          @click="close"
          class="text-gray-400 hover:text-gray-600"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
      
      <!-- Content -->
      <div class="flex-1 p-4 overflow-y-auto min-h-[300px]">
        <div class="space-y-2">
          <div v-for="group in scopeList" :key="group.snippetId" class="space-y-1">
            <!-- Group -->
            <div class="flex items-center gap-2">
              <button 
                @click="toggleExpand(group)"
                class="text-gray-500 hover:text-gray-700"
              >
                <ChevronRight v-if="!group.isExpanded" class="w-4 h-4" />
                <ChevronDown v-else class="w-4 h-4" />
              </button>
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  v-model="group.isChecked"
                  @change="toggleGroup(group)"
                  class="text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                >
                <span class="font-medium">{{ group.label }}</span>
              </label>
            </div>
            
            <!-- Children -->
            <div v-if="group.isExpanded" class="ml-6 space-y-1">
              <label 
                v-for="item in group.children"
                :key="item.liveTemplateId"
                class="flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  v-model="item.isChecked"
                  @change="updateGroupState(group)"
                  class="text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                >
                <span>{{ item.label }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="flex justify-end gap-2 p-4 border-t">
        <button 
          @click="close"
          class="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
        >
          Cancel
        </button>
        <button 
          @click="save"
          class="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, ChevronRight, ChevronDown } from 'lucide-vue-next'
import { type ScopeGroup, scopeTreeViewSelectList } from '@/models/scopeTreeViewSelectList'

const props = defineProps<{
  isOpen: boolean
  selectedScopes: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', scopes: string): void
}>()

const scopeList = ref<ScopeGroup[]>([])

// Initialize the scope list whenever the modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    // Create a fresh copy of the scope list
    scopeList.value = JSON.parse(JSON.stringify(scopeTreeViewSelectList))
    
    // Initialize checked states based on selectedScopes
    const selectedIds = new Set(props.selectedScopes.split(',').filter(Boolean))
    
    scopeList.value.forEach(group => {
      // Check if the group itself is selected
      if (selectedIds.has(group.snippetId) || selectedIds.has(group.liveTemplateId)) {
        group.isChecked = true
        group.children.forEach(child => child.isChecked = true)
      } else {
        // Check individual children
        group.children.forEach(child => {
          child.isChecked = selectedIds.has(child.snippetId) || selectedIds.has(child.liveTemplateId)
        })
        updateGroupState(group)
      }
      
      // Expand groups that have checked items
      group.isExpanded = group.isChecked || group.children.some(child => child.isChecked)
    })
  }
})


function toggleExpand(group: ScopeGroup) {
  group.isExpanded = !group.isExpanded
}

function toggleGroup(group: ScopeGroup) {
  group.children.forEach(item => {
    item.isChecked = group.isChecked
  })
}

function updateGroupState(group: ScopeGroup) {
  const checkedChildren = group.children.filter(item => item.isChecked)
  group.isChecked = checkedChildren.length === group.children.length
}

function close() {
  emit('close')
}

function save() {
  const snippetIds = new Set<string>();
  const liveTemplateIds = new Set<string>();
  
  scopeList.value.forEach(group => {
    if (group.isChecked) {
      // Add group IDs
      if (group.snippetId) snippetIds.add(group.snippetId);
      if (group.liveTemplateId) liveTemplateIds.add(group.liveTemplateId);
    } else {
      // Add checked children IDs
      group.children
        .filter(child => child.isChecked)
        .forEach(child => {
          if (child.snippetId) snippetIds.add(child.snippetId);
          if (child.liveTemplateId) liveTemplateIds.add(child.liveTemplateId);
        });
    }
  });
  
  // Convert Sets to sorted arrays
  const sortedSnippetIds = Array.from(snippetIds).sort();
  const sortedLiveTemplateIds = Array.from(liveTemplateIds).sort();

  // Combine sorted arrays with snippetIds first
  const combinedScopes = [...sortedSnippetIds, ...sortedLiveTemplateIds]
    .filter(Boolean) // Remove empty strings
    .join(',');

  emit('save', combinedScopes)
  close()
}
</script>